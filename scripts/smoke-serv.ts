#!/usr/bin/env npx tsx
/**
 * Live SERV smoke — no mocks. Requires SERV_API_KEY in env / .env
 * Usage: npx tsx --env-file=.env scripts/smoke-serv.ts
 */
import { evaluateWithServ, reviewPolicyWithServ } from "../src/lib/proof/serv.server";
import { DEFAULT_POLICY } from "../src/lib/proof/types";

async function main() {
  if (!process.env.SERV_API_KEY) {
    console.error("CONFIG_REQUIRED: SERV_API_KEY missing");
    process.exit(2);
  }

  const allowlisted = DEFAULT_POLICY.allowlist[0];
  if (!allowlisted) {
    console.error("DEFAULT_POLICY.allowlist empty");
    process.exit(2);
  }

  console.log("smoke_serv_start model=", process.env.SERV_MODEL ?? "default");

  const deny = await evaluateWithServ(
    {
      intent: "smoke over-cap transfer",
      amountUsd: 50,
      recipient: allowlisted,
      idempotencyKey: `smoke-deny-${Date.now()}`,
    },
    DEFAULT_POLICY,
  );
  console.log("deny_decision", deny.decision.decision, deny.decision.reason.slice(0, 120));
  console.log("deny_latency_ms", deny.latencyMs, "model", deny.model);

  const allow = await evaluateWithServ(
    {
      intent: "smoke under-cap allowlisted",
      amountUsd: 2,
      recipient: allowlisted,
      idempotencyKey: `smoke-allow-${Date.now()}`,
    },
    DEFAULT_POLICY,
  );
  console.log("allow_decision", allow.decision.decision, allow.decision.reason.slice(0, 120));
  console.log("allow_latency_ms", allow.latencyMs);

  if (deny.decision.decision !== "DENY") {
    console.error("smoke_serv_fail: expected DENY on $50");
    process.exit(1);
  }
  if (allow.decision.decision !== "ALLOW") {
    console.error("smoke_serv_fail: expected ALLOW on $2 allowlisted");
    process.exit(1);
  }

  const review = await reviewPolicyWithServ({
    policyText: `max $${DEFAULT_POLICY.maxAmountUsd}; allowlist ${DEFAULT_POLICY.allowlist.join(",")}`,
    context: "PROOF hackathon smoke — Base Sepolia testnet only — not financial advice",
  });
  console.log("review_latency_ms", review.latencyMs);
  console.log("review_summary", JSON.stringify(review.result).slice(0, 240));

  console.log("smoke_serv_ok");
}

main().catch((err) => {
  console.error("smoke_serv_error", err instanceof Error ? err.message : err);
  process.exit(1);
});
