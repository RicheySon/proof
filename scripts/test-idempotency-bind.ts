import assert from "node:assert/strict";
import { shouldBindIdempotency } from "../src/lib/proof/idempotency.ts";

assert.equal(shouldBindIdempotency({ rule: "OVER_CAP", decision: "DENY" }), true);
assert.equal(shouldBindIdempotency({ rule: "POLICY_ALLOW", decision: "ALLOW" }), true);
assert.equal(shouldBindIdempotency({ rule: "SERV_DENY", decision: "DENY" }), true);
assert.equal(shouldBindIdempotency({ rule: "REPLAY", decision: "DENY" }), true);
assert.equal(shouldBindIdempotency({ rule: "TRANSFER_FAILED", decision: "DENY" }), false);
assert.equal(shouldBindIdempotency({ rule: "CONFIG_REQUIRED", decision: "DENY" }), false);

console.log("idempotency-bind tests passed");
