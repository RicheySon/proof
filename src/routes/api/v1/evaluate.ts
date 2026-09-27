import { createFileRoute } from "@tanstack/react-router";
import { ProofConfigError } from "@/lib/proof/env.server";
import { runEvaluateSpine } from "@/lib/proof/evaluate.server";
import { checkRateLimit } from "@/lib/proof/rate-limit.server";
import { ensureAgentTenant } from "@/lib/proof/store.server";
import { EvaluateInputSchema } from "@/lib/proof/types";

/**
 * Agent-callable evaluate endpoint.
 * Auth: Authorization: Bearer $PROOF_AGENT_API_KEY (server-only).
 */
export const Route = createFileRoute("/api/v1/evaluate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const expected = process.env.PROOF_AGENT_API_KEY?.trim();
          if (!expected) {
            return Response.json(
              {
                ok: false,
                code: "CONFIG_REQUIRED",
                message:
                  "PROOF_AGENT_API_KEY is not configured. Agent HTTP evaluate fails closed until set.",
              },
              { status: 503 },
            );
          }
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
          if (!token || token !== expected) {
            return Response.json(
              { ok: false, code: "UNAUTHORIZED", message: "Invalid or missing Bearer token." },
              { status: 401 },
            );
          }

          const limited = checkRateLimit(`agent:${token.slice(0, 12)}`, 60, 60_000);
          if (!limited.ok) {
            return Response.json(
              {
                ok: false,
                code: "RATE_LIMITED",
                message: `Too many requests. Retry in ${limited.retryAfterSec}s.`,
              },
              { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
            );
          }

          const body = await request.json();
          const parsed = EvaluateInputSchema.safeParse(body);
          if (!parsed.success) {
            return Response.json(
              { ok: false, code: "INVALID_INPUT", message: parsed.error.message },
              { status: 400 },
            );
          }

          const tenant = ensureAgentTenant();
          const result = await runEvaluateSpine(tenant, parsed.data);
          return Response.json(result);
        } catch (error) {
          if (error instanceof ProofConfigError) {
            return Response.json(
              { ok: false, code: error.code, message: error.message },
              { status: 503 },
            );
          }
          const message = error instanceof Error ? error.message : String(error);
          return Response.json({ ok: false, code: "INTERNAL", message }, { status: 500 });
        }
      },
      GET: async () =>
        Response.json({
          ok: true,
          name: "PROOF evaluate",
          method: "POST",
          auth: "Authorization: Bearer $PROOF_AGENT_API_KEY",
          body: {
            amountUsd: "number",
            recipient: "0x…40 hex",
            intent: "string",
            idempotencyKey: "string ≥8",
          },
          honesty: "Base Sepolia testnet · fail-closed · no mock hashes",
        }),
    },
  },
});
