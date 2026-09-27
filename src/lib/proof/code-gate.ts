import { addressAllowlisted, type Policy, type RuleCode } from "./types";

export type GateInput = {
  amountUsd: number;
  recipient: string;
  policy: Policy;
  replay: boolean;
};

export type GateResult =
  { ok: true; rule: "POLICY_ALLOW" } | { ok: false; rule: RuleCode; message: string };

/**
 * Deterministic fail-closed gate. Independent of SERV prose.
 */
export function runCodeGate(input: GateInput): GateResult {
  if (input.replay) {
    return {
      ok: false,
      rule: "REPLAY",
      message: "Same payment intent was already evaluated (idempotency replay blocked).",
    };
  }

  if (input.amountUsd > input.policy.maxAmountUsd) {
    return {
      ok: false,
      rule: "OVER_CAP",
      message: `Amount $${input.amountUsd} exceeds policy cap $${input.policy.maxAmountUsd}.`,
    };
  }

  if (!addressAllowlisted(input.recipient, input.policy.allowlist)) {
    return {
      ok: false,
      rule: "PAYEE_NOT_ALLOWLISTED",
      message: "Recipient is not on the policy allowlist.",
    };
  }

  return { ok: true, rule: "POLICY_ALLOW" };
}
