/**
 * Full spine smoke: SERV DENY → ALLOW+CDP tx → REPLAY.
 * Usage: npx tsx --env-file=.env scripts/smoke-full-spine.ts
 */
import { executeAgentKitTransfer } from "../src/lib/proof/agentkit.server";
import { runCodeGate } from "../src/lib/proof/code-gate";
import { evaluateWithServ } from "../src/lib/proof/serv.server";
import { DEFAULT_POLICY } from "../src/lib/proof/types";
import { getProofEnvStatus } from "../src/lib/proof/env.server";

async function waitForUsdc(address: string, minRaw = 1n) {
  const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const data =
    "0x70a08231" + address.slice(2).toLowerCase().padStart(64, "0");
  for (let i = 0; i < 30; i++) {
    const res = await fetch("https://sepolia.base.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: USDC, data }, "latest"],
      }),
    });
    const json = (await res.json()) as { result?: string };
    const bal = BigInt(json.result ?? "0x0");
    console.log("usdc_balance_raw", bal.toString(), "attempt", i + 1);
    if (bal >= minRaw) return bal;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("USDC faucet not confirmed in time");
}

async function main() {
  const env = getProofEnvStatus();
  console.log("env", {
    serv: env.servConfigured,
    cdp: env.cdpConfigured,
    network: env.network,
    spender: process.env.CDP_EVM_ADDRESS,
    payee: process.env.PROOF_DEMO_PAYEE,
  });
  if (!env.servConfigured || !env.cdpConfigured) {
    console.error("CONFIG_REQUIRED missing SERV or CDP");
    process.exit(2);
  }

  const payee = process.env.PROOF_DEMO_PAYEE!.trim();
  const spender = process.env.CDP_EVM_ADDRESS!.trim();
  await waitForUsdc(spender, 1_000_000n); // at least $1 (6 decimals) — faucet unit

  const denyKey = `smoke-deny-${Date.now()}`;
  const denyServ = await evaluateWithServ(
    {
      intent: "over-cap smoke",
      amountUsd: 50,
      recipient: payee,
      idempotencyKey: denyKey,
    },
    DEFAULT_POLICY,
  );
  const denyGate = runCodeGate({
    amountUsd: 50,
    recipient: payee,
    policy: DEFAULT_POLICY,
    replay: false,
  });
  console.log("deny_serv", denyServ.decision.decision, denyServ.decision.reason.slice(0, 80));
  console.log("deny_gate", denyGate);
  if (denyServ.decision.decision !== "DENY" || denyGate.ok) {
    throw new Error("expected DENY path");
  }

  const allowKey = `smoke-allow-${Date.now()}`;
  const allowServ = await evaluateWithServ(
    {
      intent: "under-cap allowlisted smoke",
      amountUsd: 1,
      recipient: payee,
      idempotencyKey: allowKey,
    },
    DEFAULT_POLICY,
  );
  const allowGate = runCodeGate({
    amountUsd: 1,
    recipient: payee,
    policy: DEFAULT_POLICY,
    replay: false,
  });
  console.log("allow_serv", allowServ.decision.decision, allowServ.decision.reason.slice(0, 80));
  console.log("allow_gate", allowGate);
  if (allowServ.decision.decision !== "ALLOW" || !allowGate.ok) {
    throw new Error("expected ALLOW path before transfer");
  }

  const transfer = await executeAgentKitTransfer({
    amountUsd: 1,
    recipient: payee,
    receiptId: "smoke_full",
  });
  console.log("transfer_tx", transfer.txHash, transfer.network);
  if (!/^0x[a-fA-F0-9]{64}$/.test(transfer.txHash)) {
    throw new Error("bad tx hash");
  }

  const replayGate = runCodeGate({
    amountUsd: 1,
    recipient: payee,
    policy: DEFAULT_POLICY,
    replay: true,
  });
  console.log("replay_gate", replayGate);
  if (replayGate.ok || (replayGate as { rule: string }).rule !== "REPLAY") {
    throw new Error("expected REPLAY deny");
  }

  console.log("smoke_full_spine_ok");
  console.log("basescan", `https://sepolia.basescan.org/tx/${transfer.txHash}`);
}

main().catch((err) => {
  console.error("smoke_full_error", err instanceof Error ? err.message : err);
  process.exit(1);
});
