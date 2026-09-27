import { SignJWT, importJWK } from "jose";

const apiKeyId = process.env.CDP_API_KEY_ID;
const secret = process.env.CDP_API_KEY_SECRET;
if (!apiKeyId || !secret) {
  console.error("missing CDP_API_KEY_ID/SECRET");
  process.exit(2);
}

const decoded = Buffer.from(secret, "base64");
console.log("secret_bytes", decoded.length, "id_prefix", apiKeyId.slice(0, 8));

const key = await importJWK(
  {
    kty: "OKP",
    crv: "Ed25519",
    d: Buffer.from(decoded.subarray(0, 32)).toString("base64url"),
    x: Buffer.from(decoded.subarray(32, 64)).toString("base64url"),
  },
  "EdDSA",
);

async function call(method: string, path: string) {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    sub: apiKeyId,
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    uri: `${method} api.cdp.coinbase.com${path}`,
  })
    .setProtectedHeader({ alg: "EdDSA", kid: apiKeyId, typ: "JWT" })
    .sign(key);

  const res = await fetch(`https://api.cdp.coinbase.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
  });
  const text = await res.text();
  console.log(method, path, res.status, text.slice(0, 800));
}

await call("GET", "/platform/v2/evm/accounts");
