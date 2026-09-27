import { createFileRoute } from "@tanstack/react-router";

type Hit = { at: number; path: string; referrer: string | null };

declare global {
  var __PROOF_ANALYTICS__: Hit[] | undefined;
}

function bucket(): Hit[] {
  if (!globalThis.__PROOF_ANALYTICS__) globalThis.__PROOF_ANALYTICS__ = [];
  return globalThis.__PROOF_ANALYTICS__;
}

/**
 * First-party analytics beacon (opt-in via cookie consent).
 * Stores a short in-memory ring — no third-party cookie required.
 */
export const Route = createFileRoute("/api/v1/analytics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookie = request.headers.get("cookie") ?? "";
        if (!cookie.includes("proof_consent=analytics")) {
          return Response.json({ ok: false, code: "CONSENT_REQUIRED" }, { status: 403 });
        }
        let body: { path?: string; referrer?: string | null } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ ok: false, code: "INVALID" }, { status: 400 });
        }
        const path = String(body.path ?? "/").slice(0, 200);
        const referrer =
          typeof body.referrer === "string" ? body.referrer.slice(0, 300) : null;
        const hits = bucket();
        hits.push({ at: Date.now(), path, referrer });
        if (hits.length > 500) hits.splice(0, hits.length - 500);
        return Response.json({ ok: true });
      },
      GET: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const expected = process.env.PROOF_AGENT_API_KEY?.trim();
        if (!expected || auth !== `Bearer ${expected}`) {
          return Response.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
        }
        return Response.json({ ok: true, hits: bucket().slice(-100) });
      },
    },
  },
});
