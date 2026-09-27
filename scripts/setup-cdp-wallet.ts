/**
 * One-shot CDP wallet bootstrap (no mocks).
 * Requires CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET in env.
 * Creates proof-spender + proof-payee, faucets ETH+USDC to spender, prints addresses.
 *
 * Usage: npx tsx --env-file=.env scripts/setup-cdp-wallet.ts
 */
import { createHash, createPrivateKey, randomBytes } from "node:crypto";
import { SignJWT, importJWK, type KeyLike } from "jose";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

const CDP_HOST = "api.cdp.coinbase.com";

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sortKeys(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = sortKeys((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
}

async function importApiSigningKey(secret: string): Promise<{ key: KeyLike; alg: "EdDSA" }> {
  const decoded = Buffer.from(secret.replace(/\\n/g, ""), "base64");
  if (decoded.length !== 64) {
    throw new Error(`Expected 64-byte Ed25519 secret, got ${decoded.length}`);
  }
  const key = await importJWK(
    {
      kty: "OKP",
      crv: "Ed25519",
      d: base64Url(decoded.subarray(0, 32)),
      x: base64Url(decoded.subarray(32, 64)),
    },
    "EdDSA",
  );
  return { key, alg: "EdDSA" };
}

async function bearerJwt(opts: {
  apiKeyId: string;
  apiKeySecret: string;
  method: string;
  path: string;
}): Promise<string> {
  const { key, alg } = await importApiSigningKey(opts.apiKeySecret);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    sub: opts.apiKeyId,
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    uri: `${opts.method} ${CDP_HOST}${opts.path}`,
  })
    .setProtectedHeader({ alg, kid: opts.apiKeyId, typ: "JWT" })
    .sign(key);
}

async function walletJwt(opts: {
  walletSecret: string;
  method: string;
  path: string;
  body: object;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const uri = `${opts.method} ${CDP_HOST}${opts.path}`;
  const reqHash = createHash("sha256")
    .update(Buffer.from(JSON.stringify(sortKeys(opts.body))))
    .digest("hex");
  const key = createPrivateKey({
    key: opts.walletSecret.trim(),
    format: "der",
    type: "pkcs8",
    encoding: "base64",
  });
  return new SignJWT({
    iat: now,
    nbf: now,
    jti: randomBytes(16).toString("hex"),
    uris: [uri],
    reqHash,
  })
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .sign(key);
}

async function cdpFetch(opts: {
  method: string;
  path: string;
  body?: object;
  wallet?: boolean;
}): Promise<{ status: number; text: string; json: unknown }> {
  const apiKeyId = process.env.CDP_API_KEY_ID!;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET!;
  const walletSecret = process.env.CDP_WALLET_SECRET!;
  const body = opts.body ?? {};
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${await bearerJwt({
      apiKeyId,
      apiKeySecret,
      method: opts.method,
      path: opts.path,
    })}`,
  };
  if (opts.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }
  if (opts.wallet) {
    headers["X-Wallet-Auth"] = await walletJwt({
      walletSecret,
      method: opts.method,
      path: opts.path,
      body,
    });
  }
  const res = await fetch(`https://${CDP_HOST}${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.method === "GET" ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { status: res.status, text, json };
}

function upsertEnv(path: string, updates: Record<string, string>) {
  let content = "";
  try {
    content = readFileSync(path, "utf8");
  } catch {
    content = "";
  }
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const map = new Map<string, string>();
  for (const line of lines) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    map.set(line.slice(0, i), line.slice(i + 1));
  }
  for (const [k, v] of Object.entries(updates)) {
    map.set(k, v);
  }
  const order = [
    "SESSION_SECRET",
    "PROOF_NETWORK",
    "SERV_API_KEY",
    "SERV_MODEL",
    "SERV_BASE_URL",
    "AGENTROUTER_API_KEY",
    "AGENTROUTER_BASE_URL",
    "AGENTROUTER_USE_TOR",
    "AGENTROUTER_TOR_SOCKS",
    "AGENTROUTER_MODEL",
    "TINYFISH_API_KEY",
    "TAVILY_API_KEY",
    "CDP_API_KEY_ID",
    "CDP_API_KEY_SECRET",
    "CDP_WALLET_SECRET",
    "CDP_EVM_ADDRESS",
    "CDP_ACCOUNT_NAME",
    "PROOF_DEMO_PAYEE",
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of order) {
    if (map.has(k)) {
      out.push(`${k}=${map.get(k)}`);
      seen.add(k);
    }
  }
  for (const [k, v] of map) {
    if (!seen.has(k)) out.push(`${k}=${v}`);
  }
  writeFileSync(path, out.join("\n") + "\n", { mode: 0o600 });
}

async function getOrCreateAccount(name: string): Promise<string> {
  // Try get by name first
  const listed = await cdpFetch({ method: "GET", path: "/platform/v2/evm/accounts" });
  if (listed.status === 200 && listed.json && typeof listed.json === "object") {
    const accounts = (listed.json as { accounts?: Array<{ address?: string; name?: string }> })
      .accounts;
    const hit = accounts?.find((a) => a.name === name && a.address);
    if (hit?.address) {
      console.log("reuse_account", name, hit.address);
      return hit.address;
    }
  }

  const path = "/platform/v2/evm/accounts";
  const body = { name };
  const created = await cdpFetch({ method: "POST", path, body, wallet: true });
  console.log("create_account", name, created.status, created.text.slice(0, 400));
  if (created.status >= 400) {
    // name conflict — list again
    const again = await cdpFetch({ method: "GET", path: "/platform/v2/evm/accounts" });
    const accounts = (
      again.json as { accounts?: Array<{ address?: string; name?: string }> } | null
    )?.accounts;
    const hit = accounts?.find((a) => a.name === name && a.address);
    if (hit?.address) return hit.address;
    throw new Error(`create account failed: ${created.text.slice(0, 500)}`);
  }
  const address = (created.json as { address?: string } | null)?.address;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`create account missing address: ${created.text.slice(0, 400)}`);
  }
  return address;
}

async function faucet(address: string, token: "eth" | "usdc") {
  const path = "/platform/v2/evm/faucet";
  const body = { network: "base-sepolia", address, token };
  const res = await cdpFetch({ method: "POST", path, body, wallet: false });
  console.log("faucet", token, res.status, res.text.slice(0, 300));
  return res;
}

async function main() {
  for (const k of ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET"]) {
    if (!process.env[k]?.trim()) {
      console.error("CONFIG_REQUIRED", k);
      process.exit(2);
    }
  }

  // Persist wallet secret into .env if not already
  upsertEnv("/workspace/.env", {
    CDP_WALLET_SECRET: process.env.CDP_WALLET_SECRET!.trim(),
    CDP_ACCOUNT_NAME: process.env.CDP_ACCOUNT_NAME?.trim() || "proof-spender",
    PROOF_NETWORK: process.env.PROOF_NETWORK?.trim() || "base-sepolia",
  });

  const spender = await getOrCreateAccount("proof-spender");
  const payee = await getOrCreateAccount("proof-payee");

  await faucet(spender, "eth");
  await faucet(spender, "usdc");

  upsertEnv("/workspace/.env", {
    CDP_EVM_ADDRESS: spender,
    PROOF_DEMO_PAYEE: payee,
    CDP_ACCOUNT_NAME: "proof-spender",
  });

  appendFileSync(
    "/home/ubuntu/.config/proof-secrets/cdp_addresses.txt",
    `spender=${spender}\npayee=${payee}\nupdated=${new Date().toISOString()}\n`,
  );

  console.log("setup_cdp_ok");
  console.log("CDP_EVM_ADDRESS", spender);
  console.log("PROOF_DEMO_PAYEE", payee);
}

main().catch((err) => {
  console.error("setup_cdp_error", err instanceof Error ? err.message : err);
  process.exit(1);
});
