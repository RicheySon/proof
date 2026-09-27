import assert from "node:assert/strict";
import { runCodeGate } from "../src/lib/proof/code-gate.ts";
import { addressAllowlisted, DEFAULT_POLICY } from "../src/lib/proof/types.ts";

const policy = DEFAULT_POLICY;
const allowlisted = policy.allowlist[0]!;
const unknown = "0x00000000000000000000000000000000000000dE";
const prefixOnly = allowlisted.slice(0, 12);

assert.equal(addressAllowlisted(prefixOnly, policy.allowlist), false, "prefix must not match");
assert.equal(addressAllowlisted(allowlisted, policy.allowlist), true);

assert.equal(
  runCodeGate({ amountUsd: 50, recipient: allowlisted, policy, replay: false }).ok,
  false,
);
assert.equal(
  (
    runCodeGate({ amountUsd: 50, recipient: allowlisted, policy, replay: false }) as {
      rule: string;
    }
  ).rule,
  "OVER_CAP",
);
assert.equal(
  (runCodeGate({ amountUsd: 1, recipient: unknown, policy, replay: false }) as { rule: string })
    .rule,
  "PAYEE_NOT_ALLOWLISTED",
);
assert.equal(
  (runCodeGate({ amountUsd: 1, recipient: allowlisted, policy, replay: true }) as { rule: string })
    .rule,
  "REPLAY",
);
assert.equal(
  runCodeGate({ amountUsd: 1, recipient: allowlisted, policy, replay: false }).ok,
  true,
);
assert.equal(
  (
    runCodeGate({
      amountUsd: 1,
      recipient: allowlisted,
      policy,
      replay: false,
      spentTodayUsd: 9.5,
    }) as { rule: string }
  ).rule,
  "DAILY_BUDGET_EXCEEDED",
);

console.log("code-gate tests passed");
