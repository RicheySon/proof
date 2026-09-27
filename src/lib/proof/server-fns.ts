import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProofEnvStatus, ProofConfigError } from "./env.server";
import { runEvaluateSpine } from "./evaluate.server";
import { checkRateLimit } from "./rate-limit.server";
import { reviewPolicyWithServ } from "./serv.server";
import {
  ensureTenantSession,
  listReceipts,
  spentTodayUsd,
  tryEnsureTenantSession,
  updatePolicy,
} from "./store.server";
import { EvaluateInputSchema, PolicySchema, ReviewInputSchema, ReviewResultSchema } from "./types";

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
  const spent = session.ok ? spentTodayUsd(session.data) : 0;
  return {
    env,
    sessionReady: session.ok,
    sessionError: session.ok ? null : session.error.message,
    demoPayee: process.env.PROOF_DEMO_PAYEE?.trim() || null,
    spenderAddress: process.env.CDP_EVM_ADDRESS?.trim() || null,
    spentTodayUsd: spent,
    agentApiConfigured: Boolean(process.env.PROOF_AGENT_API_KEY?.trim()),
    servTools: ["serv_prompt_guard", "serv_shadow_agent"],
    cdpRail: "Bearer JWT + X-Wallet-Auth · CDP REST send/transaction (jose + viem)",
    honesty:
      "Base Sepolia testnet only. Not financial advice. No unhackable claims. Missing secrets fail closed — no mock transfers. Idempotency is per-instance memory on serverless (honest limit).",
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
    try {
      const tenant = ensureTenantSession();
      const limited = checkRateLimit(`ui:${tenant.session.tenantId}`, 40, 60_000);
      if (!limited.ok) {
        return {
          ok: false as const,
          code: "RATE_LIMITED",
          message: `Too many evaluates. Retry in ${limited.retryAfterSec}s.`,
        };
      }
      return await runEvaluateSpine(tenant, data);
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
