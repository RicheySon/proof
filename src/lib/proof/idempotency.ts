import type { Receipt } from "./types";

/**
 * Failed transfers / missing CDP must NOT burn the idempotency key —
 * otherwise operators cannot retry after fixing keys or a flaky send.
 * Policy DENY / ALLOW / REPLAY still bind (intent adjudicated).
 */
export function shouldBindIdempotency(receipt: Pick<Receipt, "rule" | "decision">): boolean {
  if (receipt.rule === "TRANSFER_FAILED" || receipt.rule === "CONFIG_REQUIRED") {
    return false;
  }
  return true;
}
