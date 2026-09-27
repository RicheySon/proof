import assert from "node:assert/strict";
import { hashWorkspaceKey, sessionIdFromWorkspaceKey } from "../src/lib/proof/secrets.server.ts";

const secret = "test-session-secret-for-auth-unit";
const key = "prf_ws_abcdefghijklmnopqrstuvwx";

const a = sessionIdFromWorkspaceKey(key, secret);
const b = sessionIdFromWorkspaceKey(key, secret);
const c = sessionIdFromWorkspaceKey(key + "x", secret);

assert.equal(a, b, "same recovery key → same session id");
assert.notEqual(a, c, "different key → different session id");
assert.equal(a.length, 32);
assert.equal(hashWorkspaceKey(key), hashWorkspaceKey(`  ${key}  `), "trim before hash");
assert.notEqual(hashWorkspaceKey(key), hashWorkspaceKey(key + "x"));

console.log("workspace-auth tests passed");
