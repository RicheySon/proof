import { z } from "zod";

export const DecisionSchema = z.enum(["ALLOW", "DENY"]);
export type Decision = z.infer<typeof DecisionSchema>;

export const RuleCodeSchema = z.enum([
  "POLICY_ALLOW",
  "OVER_CAP",
  "PAYEE_NOT_ALLOWLISTED",
  "REPLAY",
  "SERV_DENY",
  "SERV_INVALID",
  "SERV_SHADOW_FAIL",
  "CONFIG_REQUIRED",
  "TRANSFER_FAILED",
  "ABSTAIN",
]);
export type RuleCode = z.infer<typeof RuleCodeSchema>;

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  maxAmountUsd: z.number().positive(),
  allowlist: z.array(z.string().min(4)),
  abstainOnUncertainty: z.boolean(),
  promptVersion: z.string(),
});
export type Policy = z.infer<typeof PolicySchema>;

export const EvaluateInputSchema = z.object({
  amountUsd: z.number().positive(),
  recipient: z.string().min(4),
  intent: z.string().min(1).max(2000),
  idempotencyKey: z.string().min(8).max(128),
  policyId: z.string().optional(),
});
export type EvaluateInput = z.infer<typeof EvaluateInputSchema>;

export const ServDecisionSchema = z.object({
  decision: DecisionSchema,
  reason: z.string(),
  ruleHint: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type ServDecision = z.infer<typeof ServDecisionSchema>;

export const ReceiptSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  decision: DecisionSchema,
  amountUsd: z.number(),
  recipient: z.string(),
  intent: z.string(),
  createdAt: z.string(),
  latencyMs: z.number(),
  costUsd: z.number().nullable(),
  promptVersion: z.string(),
  shadow: z.enum(["PASS", "FAIL", "SKIPPED", "UNKNOWN"]),
  tokens: z
    .object({
      prompt: z.number().optional(),
      completion: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
  rule: RuleCodeSchema,
  network: z.string(),
  txHash: z.string().optional(),
  idempotencyKey: z.string(),
  servRawDecision: DecisionSchema.optional(),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

export const ReviewInputSchema = z.object({
  policyText: z.string().min(8).max(8000),
  context: z.string().min(1).max(8000),
});
export type ReviewInput = z.infer<typeof ReviewInputSchema>;

export const ReviewResultSchema = z.object({
  summary: z.string(),
  risks: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      evidenceGap: z.string(),
      recommendation: z.string(),
    }),
  ),
  nextSteps: z.array(z.string()),
});
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

export const DEFAULT_POLICY: Policy = {
  id: "contractor-payouts",
  name: "Contractor payouts",
  version: "1.4",
  maxAmountUsd: 5,
  allowlist: ["0x2F8B91C0", "0x4C01B822"],
  abstainOnUncertainty: true,
  promptVersion: "policy-v1.4",
};

/** Normalize addresses for allowlist compare (demo uses truncated forms). */
export function normalizeAddress(value: string): string {
  return value.trim().toLowerCase().replace(/[.…]/g, "");
}

export function addressAllowlisted(recipient: string, allowlist: string[]): boolean {
  const target = normalizeAddress(recipient);
  return allowlist.some((entry) => {
    const known = normalizeAddress(entry.split("—")[0] ?? entry);
    return target.includes(known) || known.includes(target);
  });
}
