import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getProofEnvStatus, getSessionSecret, ProofConfigError } from "./env.server";
import { DEFAULT_POLICY, type Policy, type Receipt } from "./types";

const SESSION_COOKIE = "proof_session";
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
};

type StoreRoot = {
  bySession: Map<string, TenantData>;
};

declare global {
  var __PROOF_STORE__: StoreRoot | undefined;
}

function root(): StoreRoot {
  if (!globalThis.__PROOF_STORE__) {
    globalThis.__PROOF_STORE__ = { bySession: new Map() };
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
  };
}

/**
 * Ensures a signed httpOnly session for the current request.
 * Fails closed if SESSION_SECRET is missing (no unsigned cookies, no localStorage).
 */
export function ensureTenantSession(): TenantData {
  const secret = getSessionSecret();
  const existingId = unpackCookie(getCookie(SESSION_COOKIE), secret);
  const store = root();
  if (existingId && store.bySession.has(existingId)) {
    const data = store.bySession.get(existingId)!;
    data.session.lastSeenAt = new Date().toISOString();
    return data;
  }

  const sessionId = randomBytes(24).toString("base64url");
  const data = newTenant(sessionId);
  store.bySession.set(sessionId, data);
  setCookie(SESSION_COOKIE, packCookie(sessionId, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return data;
}

export function tryEnsureTenantSession():
  { ok: true; data: TenantData } | { ok: false; error: ProofConfigError } {
  try {
    return { ok: true, data: ensureTenantSession() };
  } catch (error) {
    if (error instanceof ProofConfigError) return { ok: false, error };
    throw error;
  }
}

export function addReceipt(data: TenantData, receipt: Receipt): Receipt {
  data.receipts = [receipt, ...data.receipts].slice(0, 500);
  data.idempotency.set(receipt.idempotencyKey, receipt.id);
  return receipt;
}

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

export function envStatus() {
  return getProofEnvStatus();
}
