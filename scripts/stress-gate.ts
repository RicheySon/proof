/**
 * Back-to-back gate stress: many idempotency keys, replay, allowlist, budget.
 * Fast, no network. Usage: npx tsx scripts/stress-gate.ts
 */
import { runCodeGate } from "../src/lib/proof/code-gate";
import type { Policy } from "../src/lib/proof/types";

const PAYEE = "0xE2891FC6511652EE73A8B7Acda66e7a3fFA24b3C";
const BAD = "0x1111111111111111111111111111111111111111";

const policy: Policy = {
  id: "pol_stress",
  name: "stress",
  version: "stress-1",
  maxAmountUsd: 5,
  dailyBudgetUsd: 10,
  allowlist: [PAYEE],
  abstainOnUncertainty: true,
  promptVersion: "stress-v1",
};

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const started = Date.now();
let ok = 0;

for (let i = 0; i < 200; i++) {
  const over = runCodeGate({
    amountUsd: 50,
    recipient: PAYEE,
    policy,
    replay: false,
    spentTodayUsd: 0,
  });
  assert(!over.ok && over.rule === "OVER_CAP", `over ${i}`);
  ok += 1;
}

for (let i = 0; i < 200; i++) {
  const deny = runCodeGate({
    amountUsd: 1,
    recipient: BAD,
    policy,
    replay: false,
    spentTodayUsd: 0,
  });
  assert(!deny.ok && deny.rule === "PAYEE_NOT_ALLOWLISTED", `allowlist ${i}`);
  ok += 1;
}

for (let i = 0; i < 200; i++) {
  const replay = runCodeGate({
    amountUsd: 1,
    recipient: PAYEE,
    policy,
    replay: true,
    spentTodayUsd: 0,
  });
  assert(!replay.ok && replay.rule === "REPLAY", `replay ${i}`);
  ok += 1;
}

for (let i = 0; i < 100; i++) {
  const budget = runCodeGate({
    amountUsd: 1,
    recipient: PAYEE,
    policy,
    replay: false,
    spentTodayUsd: 9.5,
  });
  assert(!budget.ok && budget.rule === "DAILY_BUDGET_EXCEEDED", `budget ${i}`);
  ok += 1;
}

for (let i = 0; i < 200; i++) {
  const allow = runCodeGate({
    amountUsd: 1,
    recipient: PAYEE,
    policy,
    replay: false,
    spentTodayUsd: 0,
  });
  assert(allow.ok && allow.rule === "POLICY_ALLOW", `allow ${i}`);
  // Prefix / substring attack must still fail
  const prefix = runCodeGate({
    amountUsd: 1,
    recipient: PAYEE.slice(0, 10) + "000000000000000000000000000000",
    policy,
    replay: false,
    spentTodayUsd: 0,
  });
  assert(!prefix.ok, `prefix ${i}`);
  ok += 2;
}

const ms = Date.now() - started;
console.log(`stress_gate_ok checks=${ok} ms=${ms}`);
