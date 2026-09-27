import OpenAI from "openai";
import { getProofEnvStatus, requireServApiKey, ProofConfigError } from "./env.server";
import { ServDecisionSchema, type Policy, type ServDecision, type EvaluateInput } from "./types";

export type ServEvaluateResult = {
  decision: ServDecision;
  shadow: "PASS" | "FAIL" | "UNKNOWN";
  latencyMs: number;
  costUsd: number | null;
  tokens?: { prompt?: number; completion?: number; total?: number };
  model: string;
  rawContent: string;
};

function buildSystemPrompt(policy: Policy): string {
  return [
    "You are PROOF, a fail-closed spend policy judge for agent wallets.",
    "Decide ALLOW or DENY for a proposed transfer.",
    "Non-negotiable constraints:",
    `- Never ALLOW amount above ${policy.maxAmountUsd} USD.`,
    `- Never ALLOW a recipient unless it matches the allowlist: ${policy.allowlist.join(", ")}.`,
    policy.abstainOnUncertainty
      ? "- If uncertain about the recipient or amount, DENY (abstain)."
      : "- If uncertain, still prefer DENY over ALLOW.",
    "Return only structured JSON matching the schema. Do not authorize chain side effects.",
    `Prompt version: ${policy.promptVersion}.`,
  ].join("\n");
}

function shadowHint(policy: Policy): string {
  return [
    `Decision must be ALLOW or DENY.`,
    `DENY if amount > ${policy.maxAmountUsd}.`,
    `DENY if recipient is not in allowlist [${policy.allowlist.join(", ")}].`,
    `Include a clear reason string.`,
  ].join(" ");
}

/**
 * Live SERV Reasoning call. No mock path.
 */
export async function evaluateWithServ(
  input: EvaluateInput,
  policy: Policy,
): Promise<ServEvaluateResult> {
  const apiKey = requireServApiKey();
  const { servBaseUrl, servModel } = getProofEnvStatus();
  const client = new OpenAI({ apiKey, baseURL: servBaseUrl });
  const started = Date.now();

  const completion = await client.chat.completions.create({
    model: servModel,
    messages: [
      { role: "system", content: buildSystemPrompt(policy) },
      {
        role: "user",
        content: JSON.stringify({
          intent: input.intent,
          amountUsd: input.amountUsd,
          recipient: input.recipient,
          idempotencyKey: input.idempotencyKey,
          network: "base-sepolia",
        }),
      },
    ],
    tools: [
      { type: "function", function: { name: "serv_prompt_guard" } },
      {
        type: "function",
        function: {
          name: "serv_shadow_agent",
          description: "Validate spend decision against policy caps and allowlist.",
          parameters: {
            type: "object",
            properties: {
              hint: { type: "string", default: shadowHint(policy) },
              max_iterations: { type: "integer", default: 3 },
            },
          },
        },
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "proof_spend_decision",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["decision", "reason"],
          properties: {
            decision: { type: "string", enum: ["ALLOW", "DENY"] },
            reason: { type: "string" },
            ruleHint: { type: "string" },
            confidence: { type: "number" },
          },
        },
      },
    },
  });

  const latencyMs = Date.now() - started;
  const content = completion.choices[0]?.message?.content ?? "";
  let parsed: ServDecision;
  try {
    parsed = ServDecisionSchema.parse(JSON.parse(content));
  } catch {
    throw new ProofConfigError(
      `SERV returned invalid structured decision. Raw: ${content.slice(0, 400)}`,
    );
  }

  const usage = completion.usage;
  // Cost unknown without SERV pricing map — leave null rather than invent.
  return {
    decision: parsed,
    shadow: parsed.decision === "ALLOW" ? "PASS" : "FAIL",
    latencyMs,
    costUsd: null,
    tokens: usage
      ? {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        }
      : undefined,
    model: completion.model ?? servModel,
    rawContent: content,
  };
}

export async function reviewPolicyWithServ(input: {
  policyText: string;
  context: string;
}): Promise<{
  result: unknown;
  latencyMs: number;
  tokens?: { prompt?: number; completion?: number; total?: number };
}> {
  const apiKey = requireServApiKey();
  const { servBaseUrl, servModel } = getProofEnvStatus();
  const client = new OpenAI({ apiKey, baseURL: servBaseUrl });
  const started = Date.now();

  const completion = await client.chat.completions.create({
    model: servModel.replace("-serv-multipath", "") + "-serv-multipath",
    messages: [
      {
        role: "system",
        content:
          "You are a policy-risk analyst for agent spend controls. Identify compliance risks, severity, evidence gaps, and next steps. Never invent live integrations. Output structured JSON only.",
      },
      {
        role: "user",
        content: JSON.stringify({ policyText: input.policyText, context: input.context }),
      },
    ],
    tools: [
      { type: "function", function: { name: "serv_prompt_guard" } },
      {
        type: "function",
        function: {
          name: "serv_shadow_agent",
          parameters: {
            type: "object",
            properties: {
              hint: {
                type: "string",
                default:
                  "Each risk must include severity, evidence gap, and a concrete recommendation.",
              },
              max_iterations: { type: "integer", default: 3 },
            },
          },
        },
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "proof_policy_review",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["summary", "risks", "nextSteps"],
          properties: {
            summary: { type: "string" },
            risks: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "severity", "evidenceGap", "recommendation"],
                properties: {
                  title: { type: "string" },
                  severity: {
                    type: "string",
                    enum: ["low", "medium", "high", "critical"],
                  },
                  evidenceGap: { type: "string" },
                  recommendation: { type: "string" },
                },
              },
            },
            nextSteps: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const result = JSON.parse(content);
  const usage = completion.usage;
  return {
    result,
    latencyMs: Date.now() - started,
    tokens: usage
      ? {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        }
      : undefined,
  };
}
