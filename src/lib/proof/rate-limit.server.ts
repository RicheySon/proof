/**
 * Simple in-memory rate limit for evaluate / agent API.
 * Honest serverless caveat: per-instance only.
 */
type Bucket = { count: number; resetAt: number };

declare global {
  var __PROOF_RATE__: Map<string, Bucket> | undefined;
}

function store(): Map<string, Bucket> {
  if (!globalThis.__PROOF_RATE__) globalThis.__PROOF_RATE__ = new Map();
  return globalThis.__PROOF_RATE__;
}

export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const map = store();
  const current = map.get(key);
  if (!current || current.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { ok: true };
}
