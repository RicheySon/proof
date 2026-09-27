/**
 * AES-256-GCM seal for tenant BYOK secrets.
 * Keys never leave the server; client only sees connected/masked status.
 * Honest limit: sealed blobs live in per-instance memory (same as receipts).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSessionSecret } from "./env.server";

function deriveKey(sessionSecret: string): Buffer {
  return createHash("sha256").update(`proof-byok-v1:${sessionSecret}`).digest();
}

export function sealSecret(plain: string): string {
  const key = deriveKey(getSessionSecret());
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function openSecret(sealed: string): string {
  const key = deriveKey(getSessionSecret());
  const buf = Buffer.from(sealed, "base64url");
  if (buf.length < 28) throw new Error("Invalid sealed secret");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`proof-agent:${token}`).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export type TenantByokSealed = {
  servApiKey?: string;
  cdpApiKeyId?: string;
  cdpApiKeySecret?: string;
  cdpWalletSecret?: string;
  cdpEvmAddress?: string;
  /** SHA-256 of the tenant's private agent Bearer token (never store plain). */
  agentApiKeyHash?: string;
};

export type ByokPublicStatus = {
  serv: "tenant" | "env" | "none";
  cdp: "tenant" | "env" | "none";
  agentApi: "tenant" | "env" | "none";
  spenderAddress: string | null;
  /** Last 4 of tenant SERV key when set — never full key. */
  servHint: string | null;
};
