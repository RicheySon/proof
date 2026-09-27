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

const SYSTEM_PROMPT =
  "Decide ALLOW or DENY for a wallet transfer using the policy in the user JSON. " +
  "DENY when amount exceeds maxAmountUsd or recipient is not allowlisted. " +
  "Prefer DENY when unsure. Never authorize chain side effects. " +
  "Reply with structured JSON only.";

function shadowHint(policy: Policy): string {
  return [
    "decision must be ALLOW or DENY with a concrete reason string",
    `DENY when amountUsd > ${policy.maxAmountUsd}`,
    "DENY when recipient is not on policy.allowlist",
  ].join(". ");
}

function servTools(policy: Policy) {
  return [
    { type: "function" as const, function: { name: "serv_prompt_guard" } },
    {
      type: "function" as const,
      function: {
        name: "serv_shadow_agent",
        description: "Enable SERV shadow-agent validation.",
        parameters: {
          type: "object",
          properties: {
            hint: {
              type: "string",
              default: shadowHint(policy),
            },
            max_iterations: { type: "integer", default: 3 },
          },
        },
      },
    },
  ];
}

/** OpenAI strict json_schema requires every property key in `required`. */
const SPEND_DECISION_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "proof_spend_decision",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["decision", "reason", "ruleHint", "confidence"],
      properties: {
        decision: { type: "string", enum: ["ALLOW", "DENY"] },
        reason: { type: "string" },
        ruleHint: { type: "string" },
        confidence: { type: "number" },
      },
    },
  },
};

const REVIEW_FORMAT = {
  type: "json_schema" as const,
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
};

function extractContent(completion: OpenAI.Chat.Completions.ChatCompletion): string {
  const choice = completion.choices[0];
  const content = choice?.message?.content;
  const refusal = choice?.message?.refusal;
  if (refusal) {
    throw new ProofConfigError(`SERV refused output (content filter): ${refusal}`);
  }
  if (choice?.finish_reason === "content_filter") {
    throw new ProofConfigError(
      `SERV content_filter blocked output: ${String(content ?? "").slice(0, 200)}`,
    );
  }
  if (!content) {
    throw new ProofConfigError("SERV returned empty content (fail-closed).");
  }
  return content;
}

/**
 * Live SERV Reasoning call. No mock path.
 * Uses Multipath model + serv_prompt_guard + serv_shadow_agent.
 */
export async function evaluateWithServ(
  input: EvaluateInput,
  policy: Policy,
  opts?: { apiKey?: string },
): Promise<ServEvaluateResult> {
  const apiKey = opts?.apiKey?.trim() || requireServApiKey();
  const { servBaseUrl, servModel } = getProofEnvStatus();
  const client = new OpenAI({ apiKey, baseURL: servBaseUrl });
  const started = Date.now();

  const completion = await client.chat.completions.create({
    model: servModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          policy: {
            maxAmountUsd: policy.maxAmountUsd,
            allowlist: policy.allowlist,
            abstainOnUncertainty: policy.abstainOnUncertainty,
            promptVersion: policy.promptVersion,
          },
          amountUsd: input.amountUsd,
          recipient: input.recipient,
          intent: input.intent,
          idempotencyKey: input.idempotencyKey,
          network: "base-sepolia",
        }),
      },
    ],
    tools: servTools(policy),
    response_format: SPEND_DECISION_FORMAT,
  });

  const latencyMs = Date.now() - started;
  const content = extractContent(completion);
  let parsed: ServDecision;
  try {
    parsed = ServDecisionSchema.parse(JSON.parse(content));
  } catch {
    throw new ProofConfigError(
      `SERV returned invalid structured decision. Raw: ${content.slice(0, 400)}`,
    );
  }

  const usage = completion.usage;
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

export async function reviewPolicyWithServ(
  input: {
    policyText: string;
    context: string;
  },
  opts?: { apiKey?: string },
): Promise<{
  result: unknown;
  latencyMs: number;
  tokens?: { prompt?: number; completion?: number; total?: number };
}> {
  const apiKey = opts?.apiKey?.trim() || requireServApiKey();
  const { servBaseUrl, servModel } = getProofEnvStatus();
  const client = new OpenAI({ apiKey, baseURL: servBaseUrl });
  const started = Date.now();

  const completion = await client.chat.completions.create({
    model: servModel.includes("-serv-multipath")
      ? servModel
      : `${servModel.replace(/-serv-multipath$/, "")}-serv-multipath`,
    messages: [
      {
        role: "system",
        content:
          "Analyze agent spend-policy risk from the user JSON. " +
          "Return structured summary, risks (severity + evidenceGap + recommendation), and nextSteps. " +
          "Do not invent live integrations or credentials. Prefer concrete, falsifiable findings.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "policy_risk_review",
          policyText: input.policyText,
          context: input.context,
        }),
      },
    ],
    tools: [
      { type: "function", function: { name: "serv_prompt_guard" } },
      {
        type: "function",
        function: {
          name: "serv_shadow_agent",
          description: "Enable SERV shadow-agent validation.",
          parameters: {
            type: "object",
            properties: {
              hint: {
                type: "string",
                default:
                  "JSON must include summary, risks with severity/evidenceGap/recommendation, and nextSteps.",
              },
              max_iterations: { type: "integer", default: 3 },
            },
          },
        },
      },
    ],
    response_format: REVIEW_FORMAT,
  });

  const content = extractContent(completion);
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
