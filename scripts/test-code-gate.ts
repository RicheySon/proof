import assert from "node:assert/strict";
import { runCodeGate } from "../src/lib/proof/code-gate.ts";
import { DEFAULT_POLICY } from "../src/lib/proof/types.ts";

const policy = DEFAULT_POLICY;

assert.equal(
  runCodeGate({ amountUsd: 50, recipient: "0x7A91E204", policy, replay: false }).ok,
  false,
);
assert.equal(
  (
    runCodeGate({ amountUsd: 50, recipient: "0x7A91E204", policy, replay: false }) as {
      rule: string;
    }
  ).rule,
  "OVER_CAP",
);
assert.equal(
  (runCodeGate({ amountUsd: 2, recipient: "0xUNKNOWN", policy, replay: false }) as { rule: string })
    .rule,
  "PAYEE_NOT_ALLOWLISTED",
);
assert.equal(
  (runCodeGate({ amountUsd: 2, recipient: "0x2F8B91C0", policy, replay: true }) as { rule: string })
    .rule,
  "REPLAY",
);
assert.equal(
  runCodeGate({ amountUsd: 2, recipient: "0x2F8B91C0", policy, replay: false }).ok,
  true,
);

console.log("code-gate tests passed");
