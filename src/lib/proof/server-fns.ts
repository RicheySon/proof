import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { executeAgentKitTransfer } from "./agentkit.server";
import { runCodeGate } from "./code-gate";
import { getProofEnvStatus, ProofConfigError } from "./env.server";
import { evaluateWithServ, reviewPolicyWithServ } from "./serv.server";
import {
  addReceipt,
  ensureTenantSession,
  findReceiptByIdempotency,
  getActivePolicy,
  listReceipts,
  tryEnsureTenantSession,
  updatePolicy,
} from "./store.server";
import {
  EvaluateInputSchema,
  PolicySchema,
  ReviewInputSchema,
  ReviewResultSchema,
  type Receipt,
  type RuleCode,
} from "./types";

function receiptId(): string {
  return `prf_${randomBytes(4).toString("hex").toUpperCase()}`;
}

function toClientError(error: unknown): {
  ok: false;
  code: string;
  message: string;
} {
  if (error instanceof ProofConfigError) {
    return { ok: false, code: error.code, message: error.message };
  }
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, code: "INTERNAL", message };
}

export const getIntegrationStatus = createServerFn({ method: "GET" }).handler(async () => {
  const env = getProofEnvStatus();
  const session = tryEnsureTenantSession();
  return {
    env,
    sessionReady: session.ok,
    sessionError: session.ok ? null : session.error.message,
    honesty:
      "Base Sepolia testnet only. Not financial advice. No unhackable claims. Missing secrets fail closed — no mock transfers.",
  };
});

export const getReceipts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const tenant = ensureTenantSession();
    return { ok: true as const, receipts: listReceipts(tenant), tenantId: tenant.session.tenantId };
  } catch (error) {
    return toClientError(error);
  }
});

export const getPolicies = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const tenant = ensureTenantSession();
    return { ok: true as const, policies: tenant.policies, orgName: tenant.session.orgName };
  } catch (error) {
    return toClientError(error);
  }
});

export const savePolicy = createServerFn({ method: "POST" })
  .validator(PolicySchema)
  .handler(async ({ data }) => {
    try {
      const tenant = ensureTenantSession();
      const saved = updatePolicy(tenant, data);
      return { ok: true as const, policy: saved };
    } catch (error) {
      return toClientError(error);
    }
  });

export const evaluateSpend = createServerFn({ method: "POST" })
  .validator(EvaluateInputSchema)
  .handler(async ({ data }) => {
    const started = Date.now();
    try {
      const tenant = ensureTenantSession();
      const env = getProofEnvStatus();
      if (!env.servConfigured) {
        throw new ProofConfigError(
          "SERV_API_KEY is not configured. Live evaluation is required — no mock decisions.",
        );
      }

      const policy = getActivePolicy(tenant, data.policyId);
      const prior = findReceiptByIdempotency(tenant, data.idempotencyKey);
      if (prior) {
        return {
          ok: true as const,
          receipt: prior,
          replayed: true,
          stages: {
            serv: "skipped" as const,
            shadow: prior.shadow,
            promptGuard: "skipped" as const,
            codeGate: "REPLAY" as RuleCode,
            transfer: "locked" as const,
          },
        };
      }

      const serv = await evaluateWithServ(data, policy);
      let decision = serv.decision.decision;
      let rule: RuleCode = decision === "ALLOW" ? "POLICY_ALLOW" : "SERV_DENY";
      let shadow = serv.shadow;

      if (decision === "DENY" && policy.abstainOnUncertainty) {
        rule = "SERV_DENY";
      }

      const gate = runCodeGate({
        amountUsd: data.amountUsd,
        recipient: data.recipient,
        policy,
        replay: false,
      });

      // Fail closed: code gate can override SERV ALLOW.
      if (decision === "ALLOW" && !gate.ok) {
        decision = "DENY";
        rule = gate.rule;
        shadow = "FAIL";
      }

      // Fail closed: SERV DENY always sticks even if code would allow.
      if (serv.decision.decision === "DENY") {
        decision = "DENY";
        if (rule === "POLICY_ALLOW") rule = "SERV_DENY";
      }

      let txHash: string | undefined;
      let transferState: "locked" | "executed" | "config_required" | "failed" = "locked";

      if (decision === "ALLOW") {
        if (!env.cdpConfigured) {
          decision = "DENY";
          rule = "CONFIG_REQUIRED";
          transferState = "config_required";
        } else {
          try {
            const transfer = await executeAgentKitTransfer({
              amountUsd: data.amountUsd,
              recipient: data.recipient,
              receiptId: "pending",
            });
            txHash = transfer.txHash;
            transferState = "executed";
          } catch (error) {
            decision = "DENY";
            rule = "TRANSFER_FAILED";
            transferState = "failed";
            if (error instanceof ProofConfigError) {
              rule = "CONFIG_REQUIRED";
              transferState = "config_required";
            }
          }
        }
      }

      const receipt: Receipt = {
        id: receiptId(),
        tenantId: tenant.session.tenantId,
        decision,
        amountUsd: data.amountUsd,
        recipient: data.recipient,
        intent: data.intent,
        createdAt: new Date().toISOString(),
        latencyMs: Date.now() - started,
        costUsd: serv.costUsd,
        promptVersion: policy.promptVersion,
        shadow,
        tokens: serv.tokens,
        rule,
        network: env.network,
        txHash,
        idempotencyKey: data.idempotencyKey,
        servRawDecision: serv.decision.decision,
      };

      addReceipt(tenant, receipt);

      return {
        ok: true as const,
        receipt,
        replayed: false,
        stages: {
          serv: serv.decision.decision,
          shadow,
          promptGuard: "pass" as const,
          codeGate: gate.ok ? ("POLICY_ALLOW" as RuleCode) : gate.rule,
          transfer: transferState,
        },
      };
    } catch (error) {
      return toClientError(error);
    }
  });

export const reviewPolicy = createServerFn({ method: "POST" })
  .validator(ReviewInputSchema)
  .handler(async ({ data }) => {
    try {
      const env = getProofEnvStatus();
      if (!env.servConfigured) {
        throw new ProofConfigError(
          "SERV_API_KEY is not configured. Reviewer analysis requires live SERV — no mock reviews.",
        );
      }
      ensureTenantSession();
      const reviewed = await reviewPolicyWithServ(data);
      const parsed = ReviewResultSchema.parse(reviewed.result);
      return {
        ok: true as const,
        review: parsed,
        latencyMs: reviewed.latencyMs,
        tokens: reviewed.tokens,
      };
    } catch (error) {
      return toClientError(error);
    }
  });

export const updateOrgSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orgName: z.string().min(1).max(120),
      publicReceipts: z.boolean(),
      failClosed: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const tenant = ensureTenantSession();
      tenant.session.orgName = data.orgName;
      // failClosed must stay true for PROOF; refuse to disable.
      if (!data.failClosed) {
        return {
          ok: false as const,
          code: "FAIL_CLOSED_REQUIRED",
          message: "PROOF cannot disable fail-closed mode.",
        };
      }
      return {
        ok: true as const,
        orgName: tenant.session.orgName,
        publicReceipts: data.publicReceipts,
        failClosed: true,
      };
    } catch (error) {
      return toClientError(error);
    }
  });
