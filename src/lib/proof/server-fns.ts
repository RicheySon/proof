import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProofEnvStatus, ProofConfigError } from "./env.server";
import { runEvaluateSpine } from "./evaluate.server";
import { checkRateLimit } from "./rate-limit.server";
import { reviewPolicyWithServ } from "./serv.server";
import {
  clearTenantAgentKey,
  clearTenantCdp,
  clearTenantServKey,
  ensureTenantSession,
  getByokPublicStatus,
  listReceipts,
  resetTenantSession,
  resolveServApiKey,
  saveTenantAgentKey,
  saveTenantCdp,
  saveTenantServKey,
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
  const byok = session.ok
    ? getByokPublicStatus(session.data)
    : {
        serv: env.servConfigured ? ("env" as const) : ("none" as const),
        cdp: env.cdpConfigured ? ("env" as const) : ("none" as const),
        agentApi: process.env['PROOF_AGENT_API_KEY']?.trim()
          ? ("env" as const)
          : ("none" as const),
        spenderAddress: process.env['CDP_EVM_ADDRESS']?.trim() || null,
        servHint: null,
      };
  return {
    env,
    sessionReady: session.ok,
    sessionError: session.ok ? null : session.error.message,
    tenantId: session.ok ? session.data.session.tenantId : null,
    orgName: session.ok ? session.data.session.orgName : null,
    demoPayee: process.env['PROOF_DEMO_PAYEE']?.trim() || null,
    spenderAddress: byok.spenderAddress,
    spentTodayUsd: spent,
    agentApiConfigured: byok.agentApi !== "none",
    byok,
    servTools: ["serv_prompt_guard", "serv_shadow_agent"],
    cdpRail: "Bearer JWT + X-Wallet-Auth · CDP REST send/transaction (jose + viem)",
    honesty:
      "Base Sepolia testnet only. Not financial advice. No unhackable claims. Missing secrets fail closed — no mock transfers. Tenant BYOK keys are AES-GCM sealed server-side and never echoed back. Idempotency is per-instance memory on serverless (honest limit).",
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
      const tenant = ensureTenantSession();
      const servKey = resolveServApiKey(tenant);
      if (!servKey) {
        throw new ProofConfigError(
          "No SERV key. Connect yours on Integrations, or set SERV_API_KEY for the shared demo.",
        );
      }
      const reviewed = await reviewPolicyWithServ(data, { apiKey: servKey });
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

export const connectServKey = createServerFn({ method: "POST" })
  .validator(z.object({ apiKey: z.string().min(8).max(500) }))
  .handler(async ({ data }) => {
    try {
      const tenant = ensureTenantSession();
      saveTenantServKey(tenant, data.apiKey);
      return { ok: true as const, byok: getByokPublicStatus(tenant) };
    } catch (error) {
      return toClientError(error);
    }
  });

export const disconnectServKey = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const tenant = ensureTenantSession();
    clearTenantServKey(tenant);
    return { ok: true as const, byok: getByokPublicStatus(tenant) };
  } catch (error) {
    return toClientError(error);
  }
});

export const connectCdpKeys = createServerFn({ method: "POST" })
  .validator(
    z.object({
      apiKeyId: z.string().min(4).max(200),
      apiKeySecret: z.string().min(8).max(4000),
      walletSecret: z.string().min(8).max(4000),
      evmAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const tenant = ensureTenantSession();
      saveTenantCdp(tenant, data);
      return { ok: true as const, byok: getByokPublicStatus(tenant) };
    } catch (error) {
      return toClientError(error);
    }
  });

export const disconnectCdpKeys = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const tenant = ensureTenantSession();
    clearTenantCdp(tenant);
    return { ok: true as const, byok: getByokPublicStatus(tenant) };
  } catch (error) {
    return toClientError(error);
  }
});

export const connectAgentKey = createServerFn({ method: "POST" })
  .validator(z.object({ apiKey: z.string().min(16).max(200) }))
  .handler(async ({ data }) => {
    try {
      const tenant = ensureTenantSession();
      saveTenantAgentKey(tenant, data.apiKey);
      return {
        ok: true as const,
        byok: getByokPublicStatus(tenant),
        note: "Store this Bearer token now — PROOF only keeps a hash. Use it on POST /api/v1/evaluate.",
      };
    } catch (error) {
      return toClientError(error);
    }
  });

export const disconnectAgentKey = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const tenant = ensureTenantSession();
    clearTenantAgentKey(tenant);
    return { ok: true as const, byok: getByokPublicStatus(tenant) };
  } catch (error) {
    return toClientError(error);
  }
});

export const resetWorkspace = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const tenant = resetTenantSession();
    return {
      ok: true as const,
      tenantId: tenant.session.tenantId,
      byok: getByokPublicStatus(tenant),
      message: "New workspace session issued. Prior receipts and BYOK for this cookie are gone.",
    };
  } catch (error) {
    return toClientError(error);
  }
});
