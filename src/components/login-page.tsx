import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LegalShell } from "./legal-shell";
import { Button } from "./ui/button";
import { signInWorkspace } from "@/lib/proof/server-fns";

export function LoginPage() {
  const navigate = useNavigate();
  const [recoveryKey, setRecoveryKey] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <LegalShell title="Sign in" updated="Workspace recovery" kind="auth">
      <p>
        PROOF workspaces start anonymous (signed httpOnly cookie). If you{" "}
        <Link to="/settings">protected your workspace</Link>, sign back in here with the recovery
        key you saved. No email, no OAuth — the key is the credential.
      </p>

      <label className="field" style={{ display: "grid", gap: 6, marginTop: 20 }}>
        <span>Workspace recovery key</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="prf_ws_…"
          value={recoveryKey}
          onChange={(e) => setRecoveryKey(e.target.value)}
        />
      </label>

      <div className="byok-actions" style={{ marginTop: 16 }}>
        <Button
          disabled={busy || recoveryKey.trim().length < 24}
          onClick={() => {
            void (async () => {
              setBusy(true);
              try {
                const res = await signInWorkspace({ data: { recoveryKey } });
                if (!res.ok) throw new Error(res.message);
                toast.success(res.message);
                setRecoveryKey("");
                await navigate({ to: "/gate" });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : String(err));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <Button asChild variant="outline">
          <Link to="/settings">Protect a workspace</Link>
        </Button>
      </div>

      <p style={{ marginTop: 22, fontSize: 13, opacity: 0.8 }}>
        Honesty: receipts live in per-instance memory. Sign-in restores the same deterministic
        workspace id and any BYOK still on this browser&apos;s sealed cookie. A brand-new device
        gets the same tenant id after sign-in but may need to reconnect keys if the BYOK cookie is
        absent.
      </p>
    </LegalShell>
  );
}
