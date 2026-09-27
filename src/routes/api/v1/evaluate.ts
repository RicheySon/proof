import { createFileRoute } from "@tanstack/react-router";
import { ProofConfigError } from "@/lib/proof/env.server";
import { runEvaluateSpine } from "@/lib/proof/evaluate.server";
import { checkRateLimit } from "@/lib/proof/rate-limit.server";
import { resolveAgentTenant } from "@/lib/proof/store.server";
import { EvaluateInputSchema } from "@/lib/proof/types";

/**
 * Agent-callable evaluate endpoint.
 * Auth: Bearer token matching either
 *   - a tenant BYOK agent key (isolated workspace), or
 *   - shared env PROOF_AGENT_API_KEY (demo agent tenant).
 */
export const Route = createFileRoute("/api/v1/evaluate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
          if (!token) {
            return Response.json(
              { ok: false, code: "UNAUTHORIZED", message: "Missing Bearer token." },
              { status: 401 },
            );
          }

          const tenant = resolveAgentTenant(token);
          if (!tenant) {
            const envArmed = Boolean(process.env['PROOF_AGENT_API_KEY']?.trim());
            return Response.json(
              {
                ok: false,
                code: envArmed ? "UNAUTHORIZED" : "CONFIG_REQUIRED",
                message: envArmed
                  ? "Invalid Bearer token."
                  : "No agent key configured. Connect one on Integrations (BYOK) or set PROOF_AGENT_API_KEY.",
              },
              { status: envArmed ? 401 : 503 },
            );
          }

          const limited = checkRateLimit(`agent:${tenant.session.tenantId}`, 60, 60_000);
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
          auth: "Authorization: Bearer <tenant BYOK agent key | PROOF_AGENT_API_KEY>",
          body: {
            amountUsd: "number",
            recipient: "0x…40 hex",
            intent: "string",
            idempotencyKey: "string ≥8",
          },
          honesty:
            "Base Sepolia testnet · fail-closed · no mock hashes · tenant BYOK keys isolate workspaces",
        }),
    },
  },
});
