import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getProofEnvStatus, getSessionSecret, ProofConfigError } from "./env.server";
import {
  hashToken,
  openSecret,
  sealSecret,
  type ByokPublicStatus,
  type TenantByokSealed,
} from "./secrets.server";
import { DEFAULT_POLICY, type Policy, type Receipt } from "./types";
import { shouldBindIdempotency } from "./idempotency";

const SESSION_COOKIE = "proof_session";
const BYOK_COOKIE = "proof_byok_v1";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type TenantSession = {
  sessionId: string;
  tenantId: string;
  orgName: string;
  createdAt: string;
  lastSeenAt: string;
};

export type TenantData = {
  session: TenantSession;
  receipts: Receipt[];
  policies: Policy[];
  idempotency: Map<string, string>;
  /** AES-GCM sealed BYOK — never returned to the browser. */
  byok: TenantByokSealed;
};

type StoreRoot = {
  bySession: Map<string, TenantData>;
  /** agentApiKeyHash → sessionId for BYOK agent callers */
  byAgentHash: Map<string, string>;
};

declare global {
  var __PROOF_STORE__: StoreRoot | undefined;
}

function root(): StoreRoot {
  if (!globalThis.__PROOF_STORE__) {
    globalThis.__PROOF_STORE__ = {
      bySession: new Map(),
      byAgentHash: new Map(),
    };
  }
  return globalThis.__PROOF_STORE__;
}

function sign(sessionId: string, secret: string): string {
  return createHmac("sha256", secret).update(sessionId).digest("base64url");
}

function packCookie(sessionId: string, secret: string): string {
  return `${sessionId}.${sign(sessionId, secret)}`;
}

function unpackCookie(raw: string | undefined, secret: string): string | null {
  if (!raw) return null;
  const [sessionId, sig] = raw.split(".");
  if (!sessionId || !sig) return null;
  const expected = sign(sessionId, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return sessionId;
}

function cookieSecure(): boolean {
  return process.env['NODE_ENV'] === "production" || process.env['VERCEL'] === "1";
}

function newTenant(sessionId: string): TenantData {
  const now = new Date().toISOString();
  return {
    session: {
      sessionId,
      tenantId: `ten_${sessionId.slice(0, 12)}`,
      orgName: "PROOF Lab",
      createdAt: now,
      lastSeenAt: now,
    },
    receipts: [],
    policies: [{ ...DEFAULT_POLICY }],
    idempotency: new Map(),
    byok: {},
  };
}

function packByokCookie(byok: TenantByokSealed, secret: string): string | null {
  const json = JSON.stringify(byok);
  // Browser cookie practical limit ~4KB; leave headroom for signing.
  if (json.length > 3200) return null;
  const body = Buffer.from(json, "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(`byok:${body}`).digest("base64url");
  return `${body}.${sig}`;
}

function unpackByokCookie(raw: string | undefined, secret: string): TenantByokSealed | null {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(`byok:${body}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TenantByokSealed;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function persistByokCookie(data: TenantData): void {
  const secret = getSessionSecret();
  const packed = packByokCookie(data.byok, secret);
  if (!packed) {
    // Too large — keep memory only; honesty path.
    deleteCookie(BYOK_COOKIE, { path: "/" });
    return;
  }
  setCookie(BYOK_COOKIE, packed, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

function restoreByokFromCookie(data: TenantData, secret: string): void {
  const restored = unpackByokCookie(getCookie(BYOK_COOKIE), secret);
  if (!restored) return;
  const empty =
    !data.byok.servApiKey &&
    !data.byok.cdpApiKeyId &&
    !data.byok.agentApiKeyHash;
  if (!empty) return;
  data.byok = restored;
  if (restored.agentApiKeyHash) {
    root().byAgentHash.set(restored.agentApiKeyHash, data.session.sessionId);
  }
}

/**
 * Ensures a signed httpOnly session for the current request.
 * Fails closed if SESSION_SECRET is missing (no unsigned cookies, no localStorage).
 * Sealed BYOK rides in a second signed cookie so cold starts do not wipe connected keys.
 */
export function ensureTenantSession(): TenantData {
  const secret = getSessionSecret();
  const existingId = unpackCookie(getCookie(SESSION_COOKIE), secret);
  const store = root();
  if (existingId && store.bySession.has(existingId)) {
    const data = store.bySession.get(existingId)!;
    data.session.lastSeenAt = new Date().toISOString();
    if (!data.byok) data.byok = {};
    restoreByokFromCookie(data, secret);
    return data;
  }

  // Cold start: cookie signature valid but memory gone — reuse session id when possible.
  const sessionId = existingId ?? randomBytes(24).toString("base64url");
  const data = newTenant(sessionId);
  if (existingId) {
    data.session.sessionId = existingId;
    data.session.tenantId = `ten_${existingId.slice(0, 12)}`;
  }
  restoreByokFromCookie(data, secret);
  store.bySession.set(sessionId, data);
  setCookie(SESSION_COOKIE, packCookie(sessionId, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return data;
}

export function tryEnsureTenantSession():
  | { ok: true; data: TenantData }
  | { ok: false; error: ProofConfigError } {
  try {
    return { ok: true, data: ensureTenantSession() };
  } catch (error) {
    if (error instanceof ProofConfigError) return { ok: false, error };
    throw error;
  }
}

/** Wipe workspace: new session cookie, drop prior tenant memory + BYOK cookie. */
export function resetTenantSession(): TenantData {
  const secret = getSessionSecret();
  const store = root();
  const existingId = unpackCookie(getCookie(SESSION_COOKIE), secret);
  if (existingId) {
    const prior = store.bySession.get(existingId);
    if (prior?.byok.agentApiKeyHash) {
      store.byAgentHash.delete(prior.byok.agentApiKeyHash);
    }
    store.bySession.delete(existingId);
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
  deleteCookie(BYOK_COOKIE, { path: "/" });
  return ensureTenantSession();
}

export function addReceipt(
  data: TenantData,
  receipt: Receipt,
  opts?: { bindIdempotency?: boolean },
): Receipt {
  data.receipts = [receipt, ...data.receipts].slice(0, 500);
  const bind = opts?.bindIdempotency ?? shouldBindIdempotency(receipt);
  if (bind) {
    data.idempotency.set(receipt.idempotencyKey, receipt.id);
  }
  return receipt;
}

export { shouldBindIdempotency } from "./idempotency";

export function findReceiptByIdempotency(data: TenantData, key: string): Receipt | undefined {
  const id = data.idempotency.get(key);
  if (!id) return undefined;
  return data.receipts.find((r) => r.id === id);
}

export function getActivePolicy(data: TenantData, policyId?: string): Policy {
  const found = data.policies.find((p) => p.id === (policyId ?? DEFAULT_POLICY.id));
  return found ?? data.policies[0] ?? DEFAULT_POLICY;
}

export function updatePolicy(data: TenantData, policy: Policy): Policy {
  const idx = data.policies.findIndex((p) => p.id === policy.id);
  if (idx >= 0) data.policies[idx] = policy;
  else data.policies.push(policy);
  return policy;
}

export function listReceipts(data: TenantData): Receipt[] {
  return data.receipts;
}

/** Sum of ALLOW receipt amounts for the current UTC calendar day. */
export function spentTodayUsd(data: TenantData, now = new Date()): number {
  const day = now.toISOString().slice(0, 10);
  return data.receipts
    .filter((r) => r.decision === "ALLOW" && r.createdAt.startsWith(day))
    .reduce((sum, r) => sum + r.amountUsd, 0);
}

export function getByokPublicStatus(data: TenantData): ByokPublicStatus {
  const env = getProofEnvStatus();
  const servTenant = Boolean(data.byok.servApiKey);
  const cdpTenant = Boolean(
    data.byok.cdpApiKeyId &&
      data.byok.cdpApiKeySecret &&
      data.byok.cdpWalletSecret &&
      data.byok.cdpEvmAddress,
  );
  const agentTenant = Boolean(data.byok.agentApiKeyHash);
  let servHint: string | null = null;
  if (servTenant && data.byok.servApiKey) {
    try {
      const plain = openSecret(data.byok.servApiKey);
      servHint = plain.length >= 4 ? `…${plain.slice(-4)}` : "set";
    } catch {
      servHint = "set";
    }
  }
  return {
    serv: servTenant ? "tenant" : env.servConfigured ? "env" : "none",
    cdp: cdpTenant ? "tenant" : env.cdpConfigured ? "env" : "none",
    agentApi: agentTenant ? "tenant" : process.env['PROOF_AGENT_API_KEY']?.trim() ? "env" : "none",
    spenderAddress: data.byok.cdpEvmAddress
      ? (() => {
          try {
            return openSecret(data.byok.cdpEvmAddress);
          } catch {
            return data.byok.cdpEvmAddress;
          }
        })()
      : process.env['CDP_EVM_ADDRESS']?.trim() || null,
    servHint,
  };
}

export function saveTenantServKey(data: TenantData, apiKey: string): void {
  const trimmed = apiKey.trim();
  if (trimmed.length < 8) throw new ProofConfigError("SERV API key looks too short.");
  data.byok.servApiKey = sealSecret(trimmed);
  persistByokCookie(data);
}

export function clearTenantServKey(data: TenantData): void {
  delete data.byok.servApiKey;
  persistByokCookie(data);
}

export function saveTenantCdp(
  data: TenantData,
  input: {
    apiKeyId: string;
    apiKeySecret: string;
    walletSecret: string;
    evmAddress: string;
  },
): void {
  const address = input.evmAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new ProofConfigError("CDP EVM address must be a full 0x + 40 hex address.");
  }
  if (!input.apiKeyId.trim() || !input.apiKeySecret.trim() || !input.walletSecret.trim()) {
    throw new ProofConfigError("All CDP fields are required (id, secret, wallet secret, address).");
  }
  data.byok.cdpApiKeyId = sealSecret(input.apiKeyId.trim());
  data.byok.cdpApiKeySecret = sealSecret(input.apiKeySecret.trim());
  data.byok.cdpWalletSecret = sealSecret(input.walletSecret.trim());
  data.byok.cdpEvmAddress = sealSecret(address);
  persistByokCookie(data);
}

export function clearTenantCdp(data: TenantData): void {
  delete data.byok.cdpApiKeyId;
  delete data.byok.cdpApiKeySecret;
  delete data.byok.cdpWalletSecret;
  delete data.byok.cdpEvmAddress;
  persistByokCookie(data);
}

export function saveTenantAgentKey(data: TenantData, plainToken: string): void {
  const trimmed = plainToken.trim();
  if (trimmed.length < 16) {
    throw new ProofConfigError("Agent API key must be at least 16 characters.");
  }
  const store = root();
  if (data.byok.agentApiKeyHash) {
    store.byAgentHash.delete(data.byok.agentApiKeyHash);
  }
  const hash = hashToken(trimmed);
  data.byok.agentApiKeyHash = hash;
  store.byAgentHash.set(hash, data.session.sessionId);
  persistByokCookie(data);
}

export function clearTenantAgentKey(data: TenantData): void {
  const store = root();
  if (data.byok.agentApiKeyHash) {
    store.byAgentHash.delete(data.byok.agentApiKeyHash);
  }
  delete data.byok.agentApiKeyHash;
  persistByokCookie(data);
}

export function resolveServApiKey(data: TenantData): string | null {
  if (data.byok.servApiKey) {
    try {
      return openSecret(data.byok.servApiKey);
    } catch {
      return null;
    }
  }
  return process.env['SERV_API_KEY']?.trim() || null;
}

export function resolveCdpSecrets(data: TenantData): {
  apiKeyId: string;
  apiKeySecret: string;
  walletSecret: string;
  evmAddress: string;
} | null {
  if (
    data.byok.cdpApiKeyId &&
    data.byok.cdpApiKeySecret &&
    data.byok.cdpWalletSecret &&
    data.byok.cdpEvmAddress
  ) {
    try {
      return {
        apiKeyId: openSecret(data.byok.cdpApiKeyId),
        apiKeySecret: openSecret(data.byok.cdpApiKeySecret),
        walletSecret: openSecret(data.byok.cdpWalletSecret),
        evmAddress: openSecret(data.byok.cdpEvmAddress),
      };
    } catch {
      return null;
    }
  }
  const apiKeyId = process.env['CDP_API_KEY_ID']?.trim() ?? process.env['CDP_API_KEY_NAME']?.trim();
  const apiKeySecret =
    process.env['CDP_API_KEY_SECRET']?.trim() ?? process.env['CDP_API_KEY_PRIVATE_KEY']?.trim();
  const walletSecret = process.env['CDP_WALLET_SECRET']?.trim();
  const evmAddress = process.env['CDP_EVM_ADDRESS']?.trim();
  if (apiKeyId && apiKeySecret && walletSecret && evmAddress) {
    return { apiKeyId, apiKeySecret, walletSecret, evmAddress };
  }
  return null;
}

/**
 * Resolve agent Bearer → tenant.
 * 1) Tenant BYOK hash match (isolated workspace)
 * 2) Shared env PROOF_AGENT_API_KEY → dedicated agent tenant
 */
export function resolveAgentTenant(bearerToken: string): TenantData | null {
  const store = root();
  const hash = hashToken(bearerToken);
  const sessionId = store.byAgentHash.get(hash);
  if (sessionId) {
    const data = store.bySession.get(sessionId);
    if (data) {
      data.session.lastSeenAt = new Date().toISOString();
      return data;
    }
  }
  const expected = process.env['PROOF_AGENT_API_KEY']?.trim();
  if (expected && bearerToken === expected) {
    return ensureAgentTenant();
  }
  return null;
}

/**
 * Dedicated in-memory tenant for shared env agent HTTP callers.
 * Same process limits as cookie tenants — documented honesty, not a Durable ledger.
 */
export function ensureAgentTenant(): TenantData {
  const store = root();
  const sessionId = "agent_http_tenant_v1";
  const existing = store.bySession.get(sessionId);
  if (existing) {
    existing.session.lastSeenAt = new Date().toISOString();
    if (!existing.byok) existing.byok = {};
    return existing;
  }
  const data = newTenant(sessionId);
  data.session.tenantId = "ten_agent_http";
  data.session.orgName = "PROOF Agent API";
  store.bySession.set(sessionId, data);
  return data;
}

export function envStatus() {
  return getProofEnvStatus();
}
