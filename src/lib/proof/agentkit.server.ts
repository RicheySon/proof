import { createHash, createPrivateKey, randomBytes } from "node:crypto";
import { SignJWT, importJWK, importPKCS8, type KeyLike } from "jose";
import { encodeFunctionData, parseUnits, serializeTransaction, type Hex } from "viem";
import { getProofEnvStatus, ProofConfigError, requireCdpSecrets } from "./env.server";

export type TransferRequest = {
  amountUsd: number;
  recipient: string;
  receiptId: string;
  /** Tenant BYOK override — falls back to env CDP_* when omitted. */
  credentials?: {
    apiKeyId: string;
    apiKeySecret: string;
    walletSecret: string;
    evmAddress: string;
  };
};

export type TransferResult = {
  txHash: string;
  network: string;
};

const CDP_HOST = "api.cdp.coinbase.com";
/** Circle USDC on Base Sepolia — verify against Circle docs when wiring keys. */
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";

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

async function importApiSigningKey(
  secret: string,
): Promise<{ key: KeyLike; alg: "EdDSA" | "ES256" }> {
  const decoded = Buffer.from(secret.replace(/\\n/g, ""), "base64");
  if (decoded.length === 64) {
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

  const pem = secret.includes("BEGIN")
    ? secret.replace(/\\n/g, "\n")
    : `-----BEGIN PRIVATE KEY-----\n${secret}\n-----END PRIVATE KEY-----`;
  const key = await importPKCS8(pem, "ES256");
  return { key, alg: "ES256" };
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

  let key: KeyLike;
  try {
    if (opts.walletSecret.includes("BEGIN")) {
      key = await importPKCS8(opts.walletSecret.replace(/\\n/g, "\n"), "ES256");
    } else {
      key = createPrivateKey({
        key: opts.walletSecret,
        format: "der",
        type: "pkcs8",
        encoding: "base64",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ProofConfigError(`Invalid CDP_WALLET_SECRET: ${message}`);
  }

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

async function readNonce(address: string): Promise<number> {
  const response = await fetch(BASE_SEPOLIA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionCount",
      params: [address, "pending"],
    }),
  });
  const json = (await response.json()) as { result?: string; error?: { message: string } };
  if (!json.result) {
    throw new ProofConfigError(
      `Could not read nonce for ${address}: ${json.error?.message ?? "unknown RPC error"}`,
    );
  }
  return Number.parseInt(json.result, 16);
}

/**
 * Live CDP Base Sepolia USDC transfer (AgentKit-track wallet rail).
 * Cloudflare-safe stack: jose + viem + fetch. No mock hashes.
 */
export async function executeAgentKitTransfer(request: TransferRequest): Promise<TransferResult> {
  const secrets = request.credentials
    ? {
        apiKeyId: request.credentials.apiKeyId,
        apiKeySecret: request.credentials.apiKeySecret,
        walletSecret: request.credentials.walletSecret,
      }
    : requireCdpSecrets();
  const { network } = getProofEnvStatus();
  const from = request.credentials?.evmAddress?.trim() || process.env['CDP_EVM_ADDRESS']?.trim();

  if (network !== "base-sepolia") {
    throw new ProofConfigError(
      `PROOF only allows labeled testnet transfers. Refusing network=${network}.`,
    );
  }
  if (!from || !/^0x[a-fA-F0-9]{40}$/.test(from)) {
    throw new ProofConfigError(
      "CDP EVM address must be a funded 0x account for Base Sepolia transfers (tenant BYOK or CDP_EVM_ADDRESS).",
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(request.recipient)) {
    throw new ProofConfigError(
      "Recipient must be a full 0x-prefixed 40-byte address for live CDP transfer.",
    );
  }

  const amount = parseUnits(String(request.amountUsd), 6);
  if (amount <= 0n) {
    throw new ProofConfigError("Transfer amount must be positive.");
  }

  const data = encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "transfer",
    args: [request.recipient as Hex, amount],
  });

  const nonce = await readNonce(from);
  const serialized = serializeTransaction({
    chainId: 84532,
    to: USDC_BASE_SEPOLIA,
    data,
    value: 0n,
    type: "eip1559",
    maxFeePerGas: 1_500_000_000n,
    maxPriorityFeePerGas: 100_000_000n,
    gas: 120_000n,
    nonce,
  });

  const path = `/platform/v2/evm/accounts/${from}/send/transaction`;
  const body = {
    network: "base-sepolia",
    transaction: serialized,
  };
  const method = "POST";

  const [authorization, walletAuth] = await Promise.all([
    bearerJwt({
      apiKeyId: secrets.apiKeyId,
      apiKeySecret: secrets.apiKeySecret,
      method,
      path,
    }),
    walletJwt({
      walletSecret: secrets.walletSecret,
      method,
      path,
      body,
    }),
  ]);

  const response = await fetch(`https://${CDP_HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${authorization}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Wallet-Auth": walletAuth,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ProofConfigError(
      `CDP send/transaction failed (${response.status}): ${text.slice(0, 600)}`,
    );
  }

  let parsed: { transactionHash?: string };
  try {
    parsed = JSON.parse(text) as { transactionHash?: string };
  } catch {
    throw new ProofConfigError(`CDP returned non-JSON: ${text.slice(0, 400)}`);
  }

  const txHash = parsed.transactionHash ?? "";
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new ProofConfigError(`CDP response missing transactionHash: ${text.slice(0, 500)}`);
  }

  return { txHash, network };
}
