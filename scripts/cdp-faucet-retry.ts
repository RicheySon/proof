import { SignJWT, importJWK } from "jose";

const CDP_HOST = "api.cdp.coinbase.com";
const apiKeyId = process.env.CDP_API_KEY_ID;
const apiKeySecret = process.env.CDP_API_KEY_SECRET;
const spender = process.env.CDP_EVM_ADDRESS;
if (!apiKeyId || !apiKeySecret || !spender) {
  console.error("missing env");
  process.exit(2);
}

function b64url(b: Buffer) {
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
const decoded = Buffer.from(apiKeySecret, "base64");
const key = await importJWK(
  {
    kty: "OKP",
    crv: "Ed25519",
    d: b64url(decoded.subarray(0, 32)),
    x: b64url(decoded.subarray(32, 64)),
  },
  "EdDSA",
);

async function bearer(method: string, path: string) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    sub: apiKeyId,
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    uri: `${method} ${CDP_HOST}${path}`,
  })
    .setProtectedHeader({ alg: "EdDSA", kid: apiKeyId, typ: "JWT" })
    .sign(key);
}

async function faucet(token: string) {
  const path = "/platform/v2/evm/faucet";
  const body = { network: "base-sepolia", address: spender, token };
  const res = await fetch(`https://${CDP_HOST}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await bearer("POST", path)}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log("faucet", token, res.status, (await res.text()).slice(0, 400));
}

const eth = await fetch("https://sepolia.base.org", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: [spender, "latest"],
  }),
});
console.log("eth", JSON.stringify(await eth.json()));

const usdcData = "0x70a08231" + spender.slice(2).toLowerCase().padStart(64, "0");
const usdc = await fetch("https://sepolia.base.org", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [{ to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", data: usdcData }, "latest"],
  }),
});
console.log("usdc", JSON.stringify(await usdc.json()));

await faucet("usdc");
await faucet("eth");
