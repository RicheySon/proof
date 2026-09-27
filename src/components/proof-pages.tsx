import { Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  FileCheck2,
  Filter,
  LockKeyhole,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, MetaPill } from "./app-shell";
import { ProofLogo } from "./proof-logo";
import { Button } from "./ui/button";
import { useProofDemo, demoDenyAddress, demoPayeeAddress, type Decision } from "@/lib/proof-demo";
import { reviewPolicy, connectServKey, disconnectServKey, connectCdpKeys, disconnectCdpKeys, connectAgentKey, disconnectAgentKey, resetWorkspace, updateOrgSettings, protectWorkspaceFn, signOutWorkspaceFn } from "@/lib/proof/server-fns";
import type { Receipt, ReviewResult } from "@/lib/proof/types";
import { DEFAULT_POLICY } from "@/lib/proof/types";

const video =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125119_4963ddd4-c287-4044-b014-b68943cdd8bd.mp4";
const poster =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125039_45a71f04-36dd-4620-99d8-7526316d439e.png";

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link to="/" className="landing-nav__brand">
          <ProofLogo />
        </Link>
        <div className="landing-nav__links">
          <Link to="/gate">Product</Link>
          <Link to="/policies">Policies</Link>
          <Link to="/review">Review</Link>
          <Link to="/integrations">Integrations</Link>
        </div>
        <Button asChild className="landing-nav__cta">
          <Link to="/gate">Run the gate</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="landing-nav__menu"
          aria-label="Toggle menu"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <XCircle /> : <MenuIcon />}
        </Button>
        {menu && (
          <div className="landing-nav__mobile">
            <Link to="/gate" onClick={() => setMenu(false)}>
              Product
            </Link>
            <Link to="/policies" onClick={() => setMenu(false)}>
              Policies
            </Link>
            <Link to="/review" onClick={() => setMenu(false)}>
              Review
            </Link>
            <Link to="/integrations" onClick={() => setMenu(false)}>
              Integrations
            </Link>
            <Link to="/gate" className="landing-nav__mobile-cta" onClick={() => setMenu(false)}>
              Run the gate
            </Link>
          </div>
        )}
      </nav>
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <MetaPill>
            <span className="status-dot" /> AgentKit · Base Sepolia · Fail-closed
          </MetaPill>
          <h1>
            Your agent proves policy.
            <br />
            Then money moves.
          </h1>
          <p>
            Fail-closed spend control powered by SERV reasoning. Every decision becomes a verifiable
            receipt—or no transaction happens.
          </p>
          <Button asChild size="lg">
            <Link to="/gate">
              Run a spend check <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
      <section className="landing-band" aria-label="PROOF decision demonstration">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          src={video}
          poster={poster}
          aria-label="Demonstration of a DENY receipt when a spend exceeds the policy cap"
        />
        <div className="landing-receipt">
          <div className="receipt-head">
            <div>
              <p className="page-eyebrow"># PROOF RECEIPT · LIVE PATH</p>
              <h2>Spend blocked before chain.</h2>
            </div>
            <span className="decision decision--deny">
              <XCircle /> DENY
            </span>
          </div>
          <div className="receipt-rule">
            <LockKeyhole />
            <div>
              <small>Active soft</small>
              <strong>Never send over $5, to unknown addresses, or the same payment twice.</strong>
            </div>
          </div>
          <div className="proof-steps">
            <div className="done">
              <Check /> Multipath
            </div>
            <div className="failed">
              <XCircle /> Shadow
            </div>
            <div className="done">
              <Check /> PromptGuard
            </div>
            <div>
              <LockKeyhole /> Transfer locked
            </div>
          </div>
          <div className="receipt-metrics">
            <span>
              <small>Amount</small>
              <strong>$50.00</strong>
            </span>
            <span>
              <small>Rule</small>
              <strong>OVER_CAP</strong>
            </span>
            <span>
              <small>Network</small>
              <strong>Base Sepolia</strong>
            </span>
            <span>
              <small>Tx</small>
              <strong>None</strong>
            </span>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <Link to="/">PROOF</Link>
        <Link to="/login">Sign in</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/gate">Run the gate</Link>
        <span>Base Sepolia · Not financial advice</span>
      </footer>
    </div>
  );
}

function MenuIcon() {
  return <span className="menu-glyph">≡</span>;
}

type GatePhase = "form" | "evaluating" | "result" | "error";

export function GatePage() {
  const { evaluate, status, activePolicy } = useProofDemo();
  const [amount, setAmount] = useState("50");
  const [recipient, setRecipient] = useState(demoDenyAddress);
  const [intent, setIntent] = useState("Pay contractor for completed design sprint");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [honeypot, setHoneypot] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [lastAllowKey, setLastAllowKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<GatePhase>("form");
  const [decision, setDecision] = useState<Decision>("DENY");
  const [rule, setRule] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [stages, setStages] = useState<{
    serv: string;
    shadow: string;
    promptGuard: string;
    codeGate: string;
    transfer: string;
  } | null>(null);

  const servReady = Boolean(status?.env.servConfigured);
  const cdpReady = Boolean(status?.env.cdpConfigured);

  const loadPreset = (type: Decision | "REPLAY") => {
    if (type === "REPLAY") {
      if (!lastAllowKey) {
        toast.message("Run an ALLOW first, then replay the same key");
        return;
      }
      setAmount("1");
      setRecipient(demoPayeeAddress);
      setIdempotencyKey(lastAllowKey);
      setPhase("form");
      setError(null);
      setStages(null);
      setTxHash(undefined);
      return;
    }
    setAmount(type === "ALLOW" ? "1" : "50");
    setRecipient(type === "ALLOW" ? demoPayeeAddress : demoDenyAddress);
    setIdempotencyKey(crypto.randomUUID());
    setPhase("form");
    setError(null);
    setStages(null);
    setTxHash(undefined);
  };

  const runEvaluate = async () => {
    setPhase("evaluating");
    setError(null);
    setFieldError(null);
    if (honeypot.trim()) {
      setPhase("error");
      setError("Request blocked.");
      return;
    }
    const amountUsd = Number(amount);
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setPhase("form");
      setFieldError("Enter a positive USDC amount.");
      return;
    }
    if (!intent.trim() || intent.trim().length < 3) {
      setPhase("form");
      setFieldError("Intent must be at least 3 characters.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.trim())) {
      setPhase("form");
      setFieldError("Recipient must be a full 0x address (40 hex chars).");
      return;
    }
    if (idempotencyKey.trim().length < 8) {
      setPhase("form");
      setFieldError("Idempotency key must be at least 8 characters.");
      return;
    }
    try {
      const result = await evaluate({
        amountUsd,
        recipient: recipient.trim(),
        intent: intent.trim(),
        idempotencyKey: idempotencyKey.trim(),
      });
      if (!result.ok) {
        setPhase("error");
        setError(result.message);
        toast.error(result.message);
        return;
      }
      setDecision(result.receipt.decision);
      setRule(result.receipt.rule);
      setStages(result.stages);
      setTxHash(result.receipt.txHash);
      setPhase("result");
      if (result.receipt.decision === "ALLOW" && !result.replayed) {
        setLastAllowKey(idempotencyKey.trim());
      }
      if (result.replayed) toast.message("Replay blocked — DENY · REPLAY");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPhase("error");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <AppShell
      title="Spend gate"
      eyebrow="Decision workspace"
      action={
        <MetaPill>
          <span className={`status-dot ${servReady ? "" : "is-muted"}`} />
          {servReady ? "SERV live" : "SERV key required"}
        </MetaPill>
      }
    >
      <div className="gate-layout">
        <section className="surface gate-form">
          <div className="section-head">
            <div>
              <h2>Proposed transfer</h2>
              <p>Policy proof before any AgentKit side effect. No mocks.</p>
            </div>
            <span className="network-pill">Base Sepolia · Testnet</span>
          </div>
          <div className="preset-row">
            <Button variant="outline" onClick={() => loadPreset("DENY")}>
              <XCircle /> Load $50 deny
            </Button>
            <Button variant="outline" onClick={() => loadPreset("ALLOW")}>
              <CheckCircle2 /> Load $1 allow
            </Button>
            <Button variant="outline" onClick={() => loadPreset("REPLAY")} disabled={!lastAllowKey}>
              <ShieldCheck /> Load replay
            </Button>
          </div>
          <label className="field">
            <span>Transfer intent</span>
            <input value={intent} onChange={(e) => setIntent(e.target.value)} />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>Amount · USDC</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="field">
              <span>Recipient</span>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Idempotency key (blocks replay)</span>
            <input value={idempotencyKey} onChange={(e) => setIdempotencyKey(e.target.value)} />
          </label>
          <label className="hp-field" aria-hidden="true">
            <span>Company website</span>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
          {fieldError && (
            <div className="result-callout is-deny">
              <strong>Check the form</strong>
              <p>{fieldError}</p>
            </div>
          )}
          <div className="policy-preview">
            <ShieldCheck />
            <div>
              <small>
                Active policy · {activePolicy.promptVersion} · cap ${activePolicy.maxAmountUsd}
              </small>
              <p>
                Never send more than ${activePolicy.maxAmountUsd} or to unknown addresses. Same
                payment twice is DENY.
              </p>
            </div>
          </div>
          {!servReady && (
            <div className="result-callout is-deny">
              <strong>Connection required</strong>
              <p>
                SERV is not configured on this deployment. Fail-closed — no simulated ALLOW until
                the operator sets the server key.
              </p>
            </div>
          )}
          <Button
            size="lg"
            className="evaluate-btn"
            disabled={phase === "evaluating" || !servReady}
            onClick={() => void runEvaluate()}
          >
            {phase === "evaluating" ? (
              "Evaluating policy…"
            ) : (
              <>
                Prove before transfer <ArrowRight />
              </>
            )}
          </Button>
        </section>
        <section className="surface evaluation">
          <div className="section-head">
            <div>
              <h2>Decision trace</h2>
              <p>Every required proof must pass.</p>
            </div>
            {phase === "result" && (
              <span className={`decision decision--${decision.toLowerCase()}`}>
                {decision === "ALLOW" ? <CheckCircle2 /> : <XCircle />}
                {decision}
              </span>
            )}
          </div>
          <TraceStep
            index="01"
            title="SERV Multipath"
            detail="Policy and intent evaluated with structured ALLOW/DENY."
            state={
              phase === "form" || phase === "error"
                ? "idle"
                : phase === "evaluating"
                  ? "running"
                  : "pass"
            }
          />
          <TraceStep
            index="02"
            title="Shadow Agent"
            detail={
              stages?.shadow === "FAIL"
                ? `Shadow/code rule: ${rule || "DENY"}`
                : "Hint validates caps and allowlist criteria."
            }
            state={
              phase === "form" || phase === "error"
                ? "idle"
                : phase === "evaluating"
                  ? "running"
                  : stages?.shadow === "PASS"
                    ? "pass"
                    : "fail"
            }
          />
          <TraceStep
            index="03"
            title="PromptGuard + code gate"
            detail={`Deterministic gate enforces cap, allowlist, replay. Rule: ${rule || "—"}`}
            state={
              phase === "result"
                ? decision === "ALLOW"
                  ? "pass"
                  : "fail"
                : phase === "evaluating"
                  ? "idle"
                  : "idle"
            }
          />
          <TraceStep
            index="04"
            title="AgentKit transfer"
            detail={
              stages?.transfer === "executed"
                ? "Base Sepolia transfer appended to receipt."
                : cdpReady
                  ? "Locked until ALLOW."
                  : "CDP secrets required for live transfer."
            }
            state={
              phase === "result" ? (stages?.transfer === "executed" ? "pass" : "locked") : "locked"
            }
          />
          {phase === "error" && error && (
            <div className="result-callout is-deny">
              <strong>Evaluation blocked</strong>
              <p>{error}</p>
            </div>
          )}
          {phase === "result" && (
            <div
              className={
                decision === "ALLOW" ? "result-callout is-allow" : "result-callout is-deny"
              }
            >
              <strong>
                {rule === "REPLAY"
                  ? "Replay refused"
                  : decision === "ALLOW"
                    ? "Transfer allowed"
                    : "Transfer refused"}
              </strong>
              <p>
                {txHash
                  ? "Live Base Sepolia USDC transfer recorded on the receipt."
                  : `No transaction. Rule fired: ${rule}.`}
              </p>
              {txHash && (
                <a
                  className="text-sm underline"
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on Basescan
                </a>
              )}
              <Button asChild variant="outline">
                <Link to="/receipts">
                  View receipt <ChevronRight />
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function TraceStep({
  index,
  title,
  detail,
  state,
}: {
  index: string;
  title: string;
  detail: string;
  state: "idle" | "running" | "pass" | "fail" | "locked";
}) {
  return (
    <div className={`trace-step trace-step--${state}`}>
      <span className="trace-index">
        {state === "pass" ? (
          <Check />
        ) : state === "fail" ? (
          <XCircle />
        ) : state === "locked" ? (
          <LockKeyhole />
        ) : (
          index
        )}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <small>
        {state === "running"
          ? "Checking"
          : state === "pass"
            ? "Passed"
            : state === "fail"
              ? "Failed"
              : state === "locked"
                ? "Locked"
                : "Waiting"}
      </small>
    </div>
  );
}

export function ReceiptsPage() {
  const { receipts, loading, error, refresh } = useProofDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | Decision>("ALL");
  const [selected, setSelected] = useState<Receipt | null>(null);
  const visible = receipts.filter(
    (r) =>
      (filter === "ALL" || r.decision === filter) &&
      `${r.id} ${r.recipient} ${r.rule}`.toLowerCase().includes(query.toLowerCase()),
  );
  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <AppShell
      title="Receipts"
      eyebrow="Decision ledger"
      action={
        <Button asChild>
          <Link to="/gate">
            <Plus /> New check
          </Link>
        </Button>
      }
    >
      <section className="surface ledger">
        <div className="ledger-tools">
          <label className="search-field">
            <Search />
            <input
              placeholder="Search receipt, recipient, or rule"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="filter-tabs">
            <Filter />
            {(["ALL", "ALLOW", "DENY"] as const).map((item) => (
              <Button
                key={item}
                variant={filter === item ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(item)}
              >
                {item}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh
            </Button>
          </div>
        </div>
        {loading && <p className="drawer-copy">Loading tenant receipts…</p>}
        {error && (
          <div className="empty-state">
            <LockKeyhole />
            <h3>Ledger unavailable</h3>
            <p>{error}</p>
          </div>
        )}
        <div className="receipt-table">
          <div className="receipt-table__head">
            <span>Decision</span>
            <span>Receipt</span>
            <span>Amount</span>
            <span>Rule</span>
            <span>Latency</span>
            <span>Created</span>
            <span />
          </div>
          {visible.map((receipt) => (
            <button key={receipt.id} className="receipt-row" onClick={() => setSelected(receipt)}>
              <span>
                <i className={`status-mark status-mark--${receipt.decision.toLowerCase()}`} />
                {receipt.decision}
              </span>
              <code>{receipt.id}</code>
              <strong>${receipt.amountUsd.toFixed(2)}</strong>
              <span>{receipt.rule}</span>
              <span>{receipt.latencyMs} ms</span>
              <span>{new Date(receipt.createdAt).toLocaleString()}</span>
              <ChevronRight />
            </button>
          ))}
        </div>
        {!loading && !error && !visible.length && (
          <div className="empty-state">
            <FileCheck2 />
            <h3>No receipts yet</h3>
            <p>Run the spend gate. DENY and ALLOW both create server receipts.</p>
          </div>
        )}
      </section>
      {selected && (
        <div className="drawer-wrap">
          <button
            className="drawer-scrim"
            aria-label="Close receipt"
            onClick={() => setSelected(null)}
          />
          <aside className="receipt-drawer">
            <div className="drawer-head">
              <p className="page-eyebrow">Decision receipt</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <XCircle />
              </Button>
            </div>
            <span className={`decision decision--${selected.decision.toLowerCase()}`}>
              {selected.decision === "ALLOW" ? <CheckCircle2 /> : <XCircle />}
              {selected.decision}
            </span>
            <h2>
              {selected.decision === "ALLOW" ? "Policy proof passed." : "Spend stopped safely."}
            </h2>
            <p className="drawer-copy">
              Server-side ledger for this tenant.{" "}
              {selected.txHash ? "Tx hash recorded." : "No transaction."} Network:{" "}
              {selected.network}. Not financial advice.
            </p>
            <dl className="receipt-detail">
              <div>
                <dt>Receipt ID</dt>
                <dd>
                  {selected.id}
                  <Button variant="ghost" size="icon" onClick={() => copy(selected.id)}>
                    <Copy />
                  </Button>
                </dd>
              </div>
              <div>
                <dt>Rule</dt>
                <dd>{selected.rule}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>${selected.amountUsd.toFixed(2)} USDC</dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>{selected.recipient}</dd>
              </div>
              <div>
                <dt>Prompt version</dt>
                <dd>{selected.promptVersion}</dd>
              </div>
              <div>
                <dt>Shadow</dt>
                <dd>{selected.shadow}</dd>
              </div>
              <div>
                <dt>Latency / tokens / cost</dt>
                <dd>
                  {selected.latencyMs} ms ·{" "}
                  {selected.tokens?.total != null ? `${selected.tokens.total} tok` : "tokens n/a"} ·{" "}
                  {selected.costUsd == null ? "cost n/a from SERV" : `$${selected.costUsd}`}
                </dd>
              </div>
              {selected.txHash && (
                <div>
                  <dt>Tx hash</dt>
                  <dd className="tx-line">
                    <a
                      href={`https://sepolia.basescan.org/tx/${selected.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selected.txHash}
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => copy(selected.txHash ?? "")}>
                      <Copy />
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

export function PoliciesPage() {
  const { activePolicy, persistPolicy } = useProofDemo();
  const [cap, setCap] = useState(activePolicy.maxAmountUsd);
  const [dailyBudget, setDailyBudget] = useState(activePolicy.dailyBudgetUsd ?? 10);
  const [abstain, setAbstain] = useState(activePolicy.abstainOnUncertainty);
  const [allowlistText, setAllowlistText] = useState(activePolicy.allowlist.join("\n"));
  const [name, setName] = useState(activePolicy.name);

  useEffect(() => {
    setCap(activePolicy.maxAmountUsd);
    setDailyBudget(activePolicy.dailyBudgetUsd ?? 10);
    setAbstain(activePolicy.abstainOnUncertainty);
    setAllowlistText(activePolicy.allowlist.join("\n"));
    setName(activePolicy.name);
  }, [activePolicy]);

  const save = async () => {
    try {
      await persistPolicy({
        ...activePolicy,
        name,
        maxAmountUsd: cap,
        dailyBudgetUsd: dailyBudget,
        abstainOnUncertainty: abstain,
        allowlist: allowlistText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      toast.success("Policy saved for this tenant");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <AppShell
      title="Policies"
      eyebrow="Control library"
      action={
        <Button onClick={() => void save()}>
          <Check /> Save policy
        </Button>
      }
    >
      <div className="policies-layout">
        <section className="surface policy-list">
          <div className="section-head">
            <div>
              <h2>Policy library</h2>
              <p>Active rule drives the live gate.</p>
            </div>
          </div>
          <button className="policy-card is-active">
            <span className="status-dot" />
            <div>
              <strong>{name}</strong>
              <small>Active · {activePolicy.version}</small>
            </div>
            <ChevronRight />
          </button>
        </section>
        <section className="surface policy-editor">
          <div className="section-head">
            <div>
              <p className="page-eyebrow">
                {name} · {activePolicy.promptVersion}
              </p>
              <h2>Fail-closed spend rules</h2>
            </div>
            <MetaPill>Active</MetaPill>
          </div>
          <label className="field">
            <span>Policy name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Maximum transfer · USDC</span>
            <input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
          </label>
          <label className="field">
            <span>Daily budget · USDC (UTC day)</span>
            <input
              type="number"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Allowlisted recipients</span>
            <textarea value={allowlistText} onChange={(e) => setAllowlistText(e.target.value)} />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={abstain}
              onChange={(e) => setAbstain(e.target.checked)}
            />
            <span>
              <strong>Abstain on uncertainty</strong>
              <small>Ambiguous SERV results become DENY.</small>
            </span>
          </label>
          <div className="compiled-policy">
            <small>Compiled natural-language policy</small>
            <p>
              Never send more than <strong>${cap}</strong> or to unknown addresses.{" "}
              {abstain
                ? "Abstain when recipient confidence is low."
                : "Proceed when uncertain is discouraged."}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

const trend = [
  { day: "Mon", allowed: 0, denied: 0 },
  { day: "Tue", allowed: 0, denied: 0 },
  { day: "Wed", allowed: 0, denied: 0 },
  { day: "Thu", allowed: 0, denied: 0 },
  { day: "Fri", allowed: 0, denied: 0 },
  { day: "Sat", allowed: 0, denied: 0 },
  { day: "Sun", allowed: 0, denied: 0 },
];

export function AnalyticsPage() {
  const { receipts } = useProofDemo();
  const blocked = receipts
    .filter((r) => r.decision === "DENY")
    .reduce((sum, r) => sum + r.amountUsd, 0);
  const allowed = receipts.filter((r) => r.decision === "ALLOW").length;
  const chart = useMemo(() => {
    if (!receipts.length) return trend;
    const byDay = new Map<string, { day: string; allowed: number; denied: number }>();
    for (const receipt of receipts) {
      const day = new Date(receipt.createdAt).toLocaleDateString(undefined, { weekday: "short" });
      const row = byDay.get(day) ?? { day, allowed: 0, denied: 0 };
      if (receipt.decision === "ALLOW") row.allowed += 1;
      else row.denied += 1;
      byDay.set(day, row);
    }
    return [...byDay.values()];
  }, [receipts]);

  return (
    <AppShell
      title="Analytics"
      eyebrow="Policy performance"
      action={<MetaPill>Tenant receipts</MetaPill>}
    >
      <div className="metric-grid">
        <Metric
          label="Evaluated spend"
          value={`$${receipts.reduce((s, r) => s + r.amountUsd, 0).toFixed(2)}`}
          note={`${receipts.length} decisions`}
          icon={<CircleDollarSign />}
        />
        <Metric
          label="Blocked value"
          value={`$${blocked.toFixed(2)}`}
          note="Stopped before chain"
          icon={<LockKeyhole />}
        />
        <Metric
          label="Allow rate"
          value={receipts.length ? `${Math.round((allowed / receipts.length) * 100)}%` : "—"}
          note="Within active policy"
          icon={<ShieldCheck />}
        />
        <Metric
          label="Median latency"
          value={
            receipts.length
              ? `${Math.round(
                  [...receipts].sort((a, b) => a.latencyMs - b.latencyMs)[
                    Math.floor(receipts.length / 2)
                  ]?.latencyMs ?? 0,
                )} ms`
              : "—"
          }
          note="SERV + gate path"
          icon={<Clock3 />}
        />
      </div>
      <section className="surface chart-panel">
        <div className="section-head">
          <div>
            <h2>Decision volume</h2>
            <p>From live tenant receipts only — empty until evaluations run.</p>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="allowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-allow)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--chart-allow)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="allowed"
                stroke="var(--chart-allow)"
                fill="url(#allowFill)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="denied"
                stroke="var(--chart-deny)"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="surface metric">
      <span className="metric__icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

export function IntegrationsPage() {
  const { status, refresh, loading } = useProofDemo();
  const byok = status?.byok;
  const [servKey, setServKey] = useState("");
  const [agentKey, setAgentKey] = useState("");
  const [agentReveal, setAgentReveal] = useState<string | null>(null);
  const [cdp, setCdp] = useState({
    apiKeyId: "",
    apiKeySecret: "",
    walletSecret: "",
    evmAddress: "",
  });
  const [busy, setBusy] = useState<string | null>(null);

  const sourceLabel = (s: "tenant" | "env" | "none" | undefined) =>
    s === "tenant" ? "Your keys" : s === "env" ? "Shared demo" : "Not connected";

  const toneFor = (s: "tenant" | "env" | "none" | undefined) =>
    s === "none" ? "need" : s === "tenant" ? "live" : "testnet";

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell
      title="Integrations"
      eyebrow="Bring your own keys · shared demo fallback"
      action={
        <MetaPill>
          {status?.tenantId ? `tenant ${status.tenantId.slice(0, 14)}…` : "Loading"}
        </MetaPill>
      }
    >
      <section className="surface byok-panel">
        <h2>Your workspace</h2>
        <p>
          Every browser gets a signed httpOnly session. Connect your own SERV / CDP / agent Bearer
          and the gate uses <strong>your</strong> keys. Leave blank to use the shared demo env when
          the operator armed it. Keys are AES-GCM sealed server-side and never echoed back.
        </p>
        <p className="byok-honesty">{status?.honesty}</p>
      </section>

      <div className="integration-grid byok-grid">
        <section className="surface integration-card byok-card">
          <div className="integration-icon">
            <Sparkles />
          </div>
          <div>
            <h2>SERV Reasoning</h2>
            <p>
              Multipath + PromptGuard + Shadow. Source:{" "}
              <strong>{sourceLabel(byok?.serv)}</strong>
              {byok?.servHint ? ` (${byok.servHint})` : ""}
            </p>
          </div>
          <span className={`integration-status is-${toneFor(byok?.serv)}`}>
            {sourceLabel(byok?.serv)}
          </span>
          <label className="field byok-field">
            <span>Your SERV API key</span>
            <input
              type="password"
              autoComplete="off"
              placeholder="sk-… from console.openserv.ai"
              value={servKey}
              onChange={(e) => setServKey(e.target.value)}
            />
          </label>
          <div className="byok-actions">
            <Button
              disabled={busy !== null || servKey.trim().length < 8}
              onClick={() =>
                void run("serv", async () => {
                  const res = await connectServKey({ data: { apiKey: servKey } });
                  if (!res.ok) throw new Error(res.message);
                  setServKey("");
                  toast.success("SERV key sealed to this workspace");
                })
              }
            >
              {busy === "serv" ? "Saving…" : "Connect SERV"}
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null || byok?.serv !== "tenant"}
              onClick={() =>
                void run("serv-clear", async () => {
                  const res = await disconnectServKey();
                  if (!res.ok) throw new Error(res.message);
                  toast.message("Tenant SERV key cleared — demo env may still apply");
                })
              }
            >
              Disconnect
            </Button>
          </div>
        </section>

        <section className="surface integration-card byok-card">
          <div className="integration-icon">
            <CircleDollarSign />
          </div>
          <div>
            <h2>AgentKit / CDP</h2>
            <p>
              jose Bearer + X-Wallet-Auth · Base Sepolia. Source:{" "}
              <strong>{sourceLabel(byok?.cdp)}</strong>
              {byok?.spenderAddress
                ? ` · spender ${byok.spenderAddress.slice(0, 8)}…${byok.spenderAddress.slice(-4)}`
                : ""}
            </p>
          </div>
          <span className={`integration-status is-${toneFor(byok?.cdp)}`}>
            {sourceLabel(byok?.cdp)}
          </span>
          <div className="byok-cdp-fields">
            <label className="field">
              <span>API key id</span>
              <input
                autoComplete="off"
                value={cdp.apiKeyId}
                onChange={(e) => setCdp({ ...cdp, apiKeyId: e.target.value })}
              />
            </label>
            <label className="field">
              <span>API key secret</span>
              <input
                type="password"
                autoComplete="off"
                value={cdp.apiKeySecret}
                onChange={(e) => setCdp({ ...cdp, apiKeySecret: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Wallet secret</span>
              <input
                type="password"
                autoComplete="off"
                value={cdp.walletSecret}
                onChange={(e) => setCdp({ ...cdp, walletSecret: e.target.value })}
              />
            </label>
            <label className="field">
              <span>EVM address (spender)</span>
              <input
                autoComplete="off"
                placeholder="0x…"
                value={cdp.evmAddress}
                onChange={(e) => setCdp({ ...cdp, evmAddress: e.target.value })}
              />
            </label>
          </div>
          <div className="byok-actions">
            <Button
              disabled={busy !== null}
              onClick={() =>
                void run("cdp", async () => {
                  const res = await connectCdpKeys({ data: cdp });
                  if (!res.ok) throw new Error(res.message);
                  setCdp({ apiKeyId: "", apiKeySecret: "", walletSecret: "", evmAddress: "" });
                  toast.success("CDP credentials sealed to this workspace");
                })
              }
            >
              {busy === "cdp" ? "Saving…" : "Connect CDP"}
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null || byok?.cdp !== "tenant"}
              onClick={() =>
                void run("cdp-clear", async () => {
                  const res = await disconnectCdpKeys();
                  if (!res.ok) throw new Error(res.message);
                  toast.message("Tenant CDP cleared");
                })
              }
            >
              Disconnect
            </Button>
          </div>
        </section>

        <section className="surface integration-card byok-card">
          <div className="integration-icon">
            <FileCheck2 />
          </div>
          <div>
            <h2>Your agent Bearer</h2>
            <p>
              POST /api/v1/evaluate with this token hits <em>your</em> tenant (isolated receipts).
              Source: <strong>{sourceLabel(byok?.agentApi)}</strong>. We store a SHA-256 hash only.
            </p>
          </div>
          <span className={`integration-status is-${toneFor(byok?.agentApi)}`}>
            {sourceLabel(byok?.agentApi)}
          </span>
          <label className="field byok-field">
            <span>Agent API key (≥16 chars)</span>
            <input
              type="text"
              autoComplete="off"
              value={agentKey}
              onChange={(e) => {
                setAgentKey(e.target.value);
                setAgentReveal(null);
              }}
              placeholder="generate or paste — shown once after connect"
            />
          </label>
          {agentReveal && (
            <div className="byok-curl">
              <small>Copy now — we will not show this token again.</small>
              <code>{agentReveal}</code>
              <pre>{`curl -sS https://proof-smoky.vercel.app/api/v1/evaluate \\
  -H "Authorization: Bearer ${agentReveal}" \\
  -H "Content-Type: application/json" \\
  -d '{"amountUsd":1,"recipient":"0xE2891FC6511652EE73A8B7Acda66e7a3fFA24b3C","intent":"agent payout","idempotencyKey":"agent-${Date.now()}"}'`}</pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(agentReveal).then(
                    () => toast.success("Bearer copied"),
                    () => toast.error("Clipboard blocked"),
                  );
                }}
              >
                Copy Bearer
              </Button>
            </div>
          )}
          <div className="byok-actions">
            <Button
              variant="secondary"
              disabled={busy !== null}
              onClick={() => {
                const bytes = new Uint8Array(24);
                crypto.getRandomValues(bytes);
                const generated = `prf_agent_${Array.from(bytes, (b) =>
                  b.toString(16).padStart(2, "0"),
                ).join("")}`;
                setAgentKey(generated);
                setAgentReveal(null);
                toast.message("Generated — click Connect to seal the hash");
              }}
            >
              Generate key
            </Button>
            <Button
              disabled={busy !== null || agentKey.trim().length < 16}
              onClick={() =>
                void run("agent", async () => {
                  const plain = agentKey.trim();
                  const res = await connectAgentKey({ data: { apiKey: plain } });
                  if (!res.ok) throw new Error(res.message);
                  setAgentReveal(plain);
                  setAgentKey("");
                  toast.success("Agent key hashed — copy the Bearer + curl below");
                })
              }
            >
              {busy === "agent" ? "Saving…" : "Connect agent key"}
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null || byok?.agentApi !== "tenant"}
              onClick={() =>
                void run("agent-clear", async () => {
                  const res = await disconnectAgentKey();
                  if (!res.ok) throw new Error(res.message);
                  setAgentReveal(null);
                  toast.message("Tenant agent key cleared");
                })
              }
            >
              Disconnect
            </Button>
          </div>
        </section>

        <section className="surface integration-card">
          <div className="integration-icon">
            <LockKeyhole />
          </div>
          <div>
            <h2>Tenant session</h2>
            <p>
              Mode: <strong>{status?.auth?.mode ?? "anonymous"}</strong>. Protect a recovery key in
              Settings to sign out and sign back in at /login.
            </p>
          </div>
          <span className={`integration-status is-${status?.sessionReady ? "live" : "need"}`}>
            {status?.sessionReady ? "Signed in" : "Session secret required"}
          </span>
          <div className="byok-actions">
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null || loading}
              onClick={() =>
                void run("signout", async () => {
                  const res = await signOutWorkspaceFn();
                  if (!res.ok) throw new Error(res.message);
                  toast.success(res.message);
                  window.location.href = "/login";
                })
              }
            >
              {busy === "signout" ? "Signing out…" : "Sign out"}
            </Button>
            <Button
              variant="outline"
              disabled={busy !== null || loading}
              onClick={() =>
                void run("reset", async () => {
                  const res = await resetWorkspace();
                  if (!res.ok) throw new Error(res.message);
                  toast.success(res.message);
                })
              }
            >
              {busy === "reset" ? "Destroying…" : "Destroy workspace"}
            </Button>
          </div>
        </section>
      </div>

      <section className="surface" style={{ marginTop: "1.25rem", padding: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Network matrix</h2>
        <p style={{ marginTop: "0.35rem", opacity: 0.8 }}>
          Load-bearing vs parked. Spent today (UTC): ${(status?.spentTodayUsd ?? 0).toFixed(2)}.
        </p>
        <div className="integration-grid" style={{ marginTop: "1rem" }}>
          {[
            ["SERV Multipath + tools", byok?.serv === "none" ? "off" : byok?.serv ?? "…"],
            ["CDP JWT rail", byok?.cdp === "none" ? "off" : byok?.cdp ?? "…"],
            ["Code gate", "live"],
            ["Idempotency store", "per-instance"],
            ["IXS / RH", "parked"],
          ].map(([label, state]) => (
            <div key={label} className="surface" style={{ padding: "0.85rem" }}>
              <strong>{label}</strong>
              <p style={{ margin: "0.25rem 0 0", opacity: 0.75 }}>{state}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export function SettingsPage() {
  const { status, refresh } = useProofDemo();
  const [orgName, setOrgName] = useState(status?.orgName ?? "PROOF Lab");
  const [publicReceipts, setPublicReceipts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [recoveryReveal, setRecoveryReveal] = useState<string | null>(null);

  useEffect(() => {
    if (status?.orgName) setOrgName(status.orgName);
  }, [status?.orgName]);

  return (
    <AppShell
      title="Settings"
      eyebrow="Organization · Auth"
      action={
        <MetaPill>
          {status?.auth?.mode === "protected" ? "Protected workspace" : "Anonymous session"}
        </MetaPill>
      }
    >
      <div className="settings-stack">
        <section className="surface settings-section">
          <div className="section-head">
            <div>
              <h2>Workspace auth</h2>
              <p>
                Default is an anonymous signed cookie. Protect with a recovery key to sign out and
                sign in later at <Link to="/login">/login</Link>.
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            Tenant {status?.tenantId ?? "—"} · mode{" "}
            <strong>{status?.auth?.mode ?? "anonymous"}</strong>
          </p>
          {recoveryReveal && (
            <div className="byok-curl" style={{ marginTop: 12 }}>
              <small>Copy now — we only store a hash. This key signs you back in.</small>
              <code>{recoveryReveal}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(recoveryReveal).then(
                    () => toast.success("Recovery key copied"),
                    () => toast.error("Clipboard blocked"),
                  );
                }}
              >
                Copy recovery key
              </Button>
            </div>
          )}
          <div className="byok-actions" style={{ marginTop: "1rem" }}>
            <Button
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const bytes = new Uint8Array(24);
                    crypto.getRandomValues(bytes);
                    const key = `prf_ws_${Array.from(bytes, (b) =>
                      b.toString(16).padStart(2, "0"),
                    ).join("")}`;
                    const res = await protectWorkspaceFn({ data: { recoveryKey: key } });
                    if (!res.ok) throw new Error(res.message);
                    setRecoveryReveal(key);
                    toast.success(res.message);
                    await refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : String(err));
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              {status?.auth?.mode === "protected" ? "Rotate recovery key" : "Protect workspace"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const res = await signOutWorkspaceFn();
                    if (!res.ok) throw new Error(res.message);
                    toast.success(res.message);
                    window.location.href = "/login";
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : String(err));
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Sign out
            </Button>
          </div>
        </section>

        <section className="surface settings-section">
          <div className="section-head">
            <div>
              <h2>Organization</h2>
              <p>Connect keys on Integrations. Label this tenant for receipts.</p>
            </div>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Organization name</span>
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </label>
            <label className="field">
              <span>Network</span>
              <input value={status?.env.network ?? "base-sepolia"} readOnly />
            </label>
          </div>
        </section>
        <section className="surface settings-section">
          <div className="section-head">
            <div>
              <h2>Safety defaults</h2>
              <p>Fail-closed cannot be disabled.</p>
            </div>
          </div>
          <SettingToggle
            checked
            onChange={() => toast.message("Fail-closed is required")}
            title="Fail closed on any error"
            detail="Blocks side effects when SERV, schema, gate, or CDP checks fail."
          />
          <SettingToggle
            checked={publicReceipts}
            onChange={setPublicReceipts}
            title="Show Basescan links on ALLOW"
            detail="Tx hashes are public on Base Sepolia when a transfer executes."
          />
          <div className="byok-actions" style={{ marginTop: "1rem" }}>
            <Button
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const res = await updateOrgSettings({
                      data: { orgName, publicReceipts, failClosed: true },
                    });
                    if (!res.ok) throw new Error(res.message);
                    toast.success("Settings saved");
                    await refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : String(err));
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Save settings
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const res = await resetWorkspace();
                    if (!res.ok) throw new Error(res.message);
                    setRecoveryReveal(null);
                    toast.success(res.message);
                    await refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : String(err));
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              Destroy workspace
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SettingToggle({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  detail: string;
}) {
  return (
    <label className="setting-toggle">
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  );
}

export function ReviewPage() {
  const { status } = useProofDemo();
  const [policyText, setPolicyText] = useState(
    "Never send more than $5 or to unknown addresses. Deny replayed payments.",
  );
  const [context, setContext] = useState("Agent proposes $50 payout to a new contractor wallet.");
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const servReady =
    status?.byok?.serv === "tenant" ||
    status?.byok?.serv === "env" ||
    Boolean(status?.env.servConfigured);

  const run = async () => {
    setPhase("loading");
    setError(null);
    try {
      const result = await reviewPolicy({ data: { policyText, context } });
      if (!result.ok) {
        setPhase("error");
        setError(result.message);
        return;
      }
      setReview(result.review);
      setPhase("success");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <AppShell
      title="Policy review"
      eyebrow="Reviewer intelligence"
      action={
        <MetaPill>
          <span className={`status-dot ${servReady ? "" : "is-muted"}`} />
          {servReady ? "SERV ready" : "Connection required"}
        </MetaPill>
      }
    >
      <div className="policies-layout">
        <section className="surface policy-editor">
          <div className="section-head">
            <div>
              <h2>Inputs</h2>
              <p>Structured risk analysis via live SERV. No mock reviews.</p>
            </div>
            <ShieldAlert />
          </div>
          <label className="field">
            <span>Policy</span>
            <textarea value={policyText} onChange={(e) => setPolicyText(e.target.value)} rows={6} />
          </label>
          <label className="field">
            <span>Decision context</span>
            <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={5} />
          </label>
          <Button size="lg" disabled={!servReady || phase === "loading"} onClick={() => void run()}>
            {phase === "loading" ? "Analyzing…" : "Analyze policy risk"}
          </Button>
          {!servReady && (
            <div className="result-callout is-deny">
              <strong>Connection required</strong>
              <p>
                Connect a SERV key on Integrations (or arm the shared demo env). Reviewer will not
                invent findings.
              </p>
            </div>
          )}
          {phase === "error" && error && (
            <div className="result-callout is-deny">
              <strong>Review failed</strong>
              <p>{error}</p>
            </div>
          )}
        </section>
        <section className="surface policy-list">
          <div className="section-head">
            <div>
              <h2>Findings</h2>
              <p>Severity, evidence gaps, next steps.</p>
            </div>
          </div>
          {!review && phase === "idle" && (
            <div className="empty-state">
              <ShieldAlert />
              <h3>Waiting for analysis</h3>
              <p>Submit a policy and context to generate a live review.</p>
            </div>
          )}
          {review && (
            <div className="settings-stack">
              <p>{review.summary}</p>
              {review.risks.map((risk) => (
                <div className="policy-card is-active" key={risk.title}>
                  <span className="status-dot" />
                  <div>
                    <strong>
                      {risk.title} · {risk.severity}
                    </strong>
                    <small>
                      Gap: {risk.evidenceGap}. Next: {risk.recommendation}
                    </small>
                  </div>
                </div>
              ))}
              <div className="compiled-policy">
                <small>Next steps</small>
                <ul>
                  {review.nextSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export { DEFAULT_POLICY };
