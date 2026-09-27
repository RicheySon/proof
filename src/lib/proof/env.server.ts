/**
 * Environment contract for PROOF.
 * Never log secret values. Missing secrets fail closed at call sites.
 */

export type ProofEnvStatus = {
  servConfigured: boolean;
  cdpConfigured: boolean;
  sessionSecretConfigured: boolean;
  network: string;
  servModel: string;
  servBaseUrl: string;
};

function read(name: string): string | undefined {
  const value = process.env[name];
  if (!value || !value.trim()) return undefined;
  return value.trim();
}

export function getProofEnvStatus(): ProofEnvStatus {
  const apiKeyId = read("CDP_API_KEY_ID") ?? read("CDP_API_KEY_NAME");
  const apiKeySecret = read("CDP_API_KEY_SECRET") ?? read("CDP_API_KEY_PRIVATE_KEY");
  const walletSecret = read("CDP_WALLET_SECRET");
  const evmAddress = read("CDP_EVM_ADDRESS");
  return {
    servConfigured: Boolean(read("SERV_API_KEY")),
    cdpConfigured: Boolean(apiKeyId && apiKeySecret && walletSecret && evmAddress),
    sessionSecretConfigured: Boolean(read("SESSION_SECRET")),
    network: read("PROOF_NETWORK") ?? "base-sepolia",
    servModel: read("SERV_MODEL") ?? "gpt-5.4-mini-serv-multipath",
    servBaseUrl: read("SERV_BASE_URL") ?? "https://inference-api.openserv.ai/v1",
  };
}

export function requireServApiKey(): string {
  const key = read("SERV_API_KEY");
  if (!key) {
    throw new ProofConfigError(
      "SERV_API_KEY is not configured. Create a key at console.openserv.ai and set SERV_API_KEY.",
    );
  }
  return key;
}

export function requireCdpSecrets(): {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret: string;
} {
  const apiKeyId = read("CDP_API_KEY_ID") ?? read("CDP_API_KEY_NAME");
  const apiKeySecret = read("CDP_API_KEY_SECRET") ?? read("CDP_API_KEY_PRIVATE_KEY");
  const walletSecret = read("CDP_WALLET_SECRET");
  if (!apiKeyId || !apiKeySecret || !walletSecret) {
    throw new ProofConfigError(
      "CDP / AgentKit secrets are not configured (CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET, CDP_EVM_ADDRESS).",
    );
  }
  return { apiKeyId, apiKeySecret, walletSecret };
}

export function getSessionSecret(): string {
  const secret = read("SESSION_SECRET");
  if (!secret) {
    throw new ProofConfigError(
      "SESSION_SECRET is not configured. Set a long random SESSION_SECRET before serving sessions.",
    );
  }
  return secret;
}

export class ProofConfigError extends Error {
  readonly code = "CONFIG_REQUIRED" as const;
  constructor(message: string) {
    super(message);
    this.name = "ProofConfigError";
  }
}

export class ProofGateError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ProofGateError";
    this.code = code;
  }
}
