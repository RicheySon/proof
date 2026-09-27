import { randomBytes } from "node:crypto";
import { executeAgentKitTransfer } from "./agentkit.server";
import { runCodeGate } from "./code-gate";
import { getProofEnvStatus, ProofConfigError } from "./env.server";
import { evaluateWithServ } from "./serv.server";
import {
  addReceipt,
  findReceiptByIdempotency,
  getActivePolicy,
  resolveCdpSecrets,
  resolveServApiKey,
  spentTodayUsd,
  type TenantData,
} from "./store.server";
import type { EvaluateInput, Receipt, RuleCode } from "./types";

function receiptId(): string {
  return `prf_${randomBytes(4).toString("hex").toUpperCase()}`;
}

export type EvaluateSuccess = {
  ok: true;
  receipt: Receipt;
  replayed: boolean;
  stages: {
    serv: string;
    shadow: Receipt["shadow"];
    promptGuard: string;
    codeGate: RuleCode | string;
    transfer: string;
  };
  toolsDeclared: string[];
};

/**
 * Shared evaluate spine for UI server-fns and agent HTTP API.
 * Fail-closed: SERV → code gate (cap/allowlist/replay/daily) → CDP only on ALLOW.
 */
export async function runEvaluateSpine(
  tenant: TenantData,
  data: EvaluateInput,
): Promise<EvaluateSuccess> {
  const started = Date.now();
  const env = getProofEnvStatus();
  const servKey = resolveServApiKey(tenant);
  if (!servKey) {
    throw new ProofConfigError(
      "No SERV key for this workspace. Connect your key on Integrations, or set SERV_API_KEY for the shared demo.",
    );
  }

  const policy = getActivePolicy(tenant, data.policyId);
  const prior = findReceiptByIdempotency(tenant, data.idempotencyKey);
  if (prior) {
    const replayReceipt: Receipt = {
      id: receiptId(),
      tenantId: tenant.session.tenantId,
      decision: "DENY",
      amountUsd: data.amountUsd,
      recipient: data.recipient,
      intent: data.intent,
      createdAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      costUsd: null,
      promptVersion: policy.promptVersion,
      shadow: "FAIL",
      rule: "REPLAY",
      network: env.network,
      idempotencyKey: data.idempotencyKey,
      servRawDecision: prior.servRawDecision,
    };
    // Do not overwrite the original idempotency mapping — prior stays the first attempt.
    tenant.receipts = [replayReceipt, ...tenant.receipts].slice(0, 500);
    return {
      ok: true,
      receipt: replayReceipt,
      replayed: true,
      stages: {
        serv: "skipped",
        shadow: "FAIL",
        promptGuard: "skipped",
        codeGate: "REPLAY",
        transfer: "locked",
      },
      toolsDeclared: ["serv_prompt_guard", "serv_shadow_agent"],
    };
  }

  const serv = await evaluateWithServ(data, policy, { apiKey: servKey });
  let decision = serv.decision.decision;
  let rule: RuleCode = decision === "ALLOW" ? "POLICY_ALLOW" : "SERV_DENY";
  let shadow = serv.shadow;

  const gate = runCodeGate({
    amountUsd: data.amountUsd,
    recipient: data.recipient,
    policy,
    replay: false,
    spentTodayUsd: spentTodayUsd(tenant),
  });

  if (decision === "ALLOW" && !gate.ok) {
    decision = "DENY";
    rule = gate.rule;
    shadow = "FAIL";
  }

  if (serv.decision.decision === "DENY") {
    decision = "DENY";
    if (rule === "POLICY_ALLOW") rule = "SERV_DENY";
  }

  let txHash: string | undefined;
  let transferState: "locked" | "executed" | "config_required" | "failed" = "locked";
  const cdp = resolveCdpSecrets(tenant);

  if (decision === "ALLOW") {
    if (!cdp) {
      decision = "DENY";
      rule = "CONFIG_REQUIRED";
      transferState = "config_required";
    } else {
      try {
        const transfer = await executeAgentKitTransfer({
          amountUsd: data.amountUsd,
          recipient: data.recipient,
          receiptId: "pending",
          credentials: cdp,
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
    ok: true,
    receipt,
    replayed: false,
    stages: {
      serv: serv.decision.decision,
      shadow,
      promptGuard: "declared",
      codeGate: gate.ok ? "POLICY_ALLOW" : gate.rule,
      transfer: transferState,
    },
    toolsDeclared: ["serv_prompt_guard", "serv_shadow_agent"],
  };
}
