import { Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Copy, ExternalLink, FileCheck2, Filter, LockKeyhole, Play, Plus, Search, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, MetaPill } from "./app-shell";
import { ProofLogo } from "./proof-logo";
import { Button } from "./ui/button";
import { useProofDemo, shortAddress, type Decision, type Receipt } from "@/lib/proof-demo";

const video = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125119_4963ddd4-c287-4044-b014-b68943cdd8bd.mp4";
const poster = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_125039_45a71f04-36dd-4620-99d8-7526316d439e.png";

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  return <div className="landing">
    <nav className="landing-nav">
      <Link to="/" className="landing-nav__brand"><ProofLogo /></Link>
      <div className="landing-nav__links"><Link to="/gate">Product</Link><Link to="/policies">Policies</Link><Link to="/analytics">Analytics</Link><Link to="/integrations">Integrations</Link></div>
      <Button asChild className="landing-nav__cta"><Link to="/gate">Run the demo</Link></Button>
      <Button variant="ghost" size="icon" className="landing-nav__menu" aria-label="Toggle menu" onClick={() => setMenu(!menu)}>{menu ? <XCircle /> : <MenuIcon />}</Button>
      {menu && <div className="landing-nav__mobile"><Link to="/gate">Product</Link><Link to="/policies">Policies</Link><Link to="/analytics">Analytics</Link><Link to="/integrations">Integrations</Link></div>}
    </nav>
    <section className="landing-hero">
      <div className="landing-hero__copy">
        <MetaPill><span className="status-dot" /> Built for AgentKit · Base Sepolia</MetaPill>
        <h1>Your agent proves policy.<br />Then money moves.</h1>
        <p>Fail-closed spend control powered by SERV reasoning. Every decision becomes a verifiable receipt—or no transaction happens.</p>
        <Button asChild size="lg"><Link to="/gate">Run a spend check <ArrowRight /></Link></Button>
      </div>
    </section>
    <section className="landing-band" aria-label="PROOF decision demonstration">
      <video autoPlay muted loop playsInline src={video} poster={poster} />
      <div className="landing-receipt">
        <div className="receipt-head"><div><p className="page-eyebrow"># PROOF RECEIPT · PRF_8F2K1A</p><h2>Spend blocked before chain.</h2></div><span className="decision decision--deny"><XCircle /> DENY</span></div>
        <div className="receipt-rule"><LockKeyhole /><div><small>Active policy</small><strong>Never send over $5 or to unknown addresses.</strong></div></div>
        <div className="proof-steps"><div className="done"><Check /> Multipath</div><div className="failed"><XCircle /> Shadow</div><div className="done"><Check /> PromptGuard</div><div><LockKeyhole /> Transfer locked</div></div>
        <div className="receipt-metrics"><span><small>Amount</small><strong>$50.00</strong></span><span><small>Latency</small><strong>842 ms</strong></span><span><small>Cost</small><strong>$0.0031</strong></span><span><small>Network</small><strong>Base Sepolia</strong></span></div>
      </div>
    </section>
  </div>;
}

function MenuIcon() { return <span className="menu-glyph">≡</span>; }

type GatePhase = "form" | "evaluating" | "result";
export function GatePage() {
  const { addReceipt } = useProofDemo();
  const [amount, setAmount] = useState("50");
  const [recipient, setRecipient] = useState("0x7A91…E204");
  const [known, setKnown] = useState(false);
  const [phase, setPhase] = useState<GatePhase>("form");
  const [decision, setDecision] = useState<Decision>("DENY");

  const loadPreset = (type: Decision) => { setAmount(type === "ALLOW" ? "2" : "50"); setRecipient(type === "ALLOW" ? shortAddress : "0x7A91…E204"); setKnown(type === "ALLOW"); setPhase("form"); };
  const evaluate = () => {
    setPhase("evaluating");
    const nextDecision: Decision = Number(amount) <= 5 && known ? "ALLOW" : "DENY";
    window.setTimeout(() => {
      setDecision(nextDecision);
      const receipt: Receipt = { id: `prf_${Math.random().toString(36).slice(2, 8).toUpperCase()}`, decision: nextDecision, amount: Number(amount), recipient, createdAt: "Just now", latency: nextDecision === "ALLOW" ? 716 : 842, cost: nextDecision === "ALLOW" ? .0028 : .0031, shadow: nextDecision === "ALLOW" ? "PASS" : "FAIL", tx: nextDecision === "ALLOW" ? `0x${Math.random().toString(16).slice(2).padEnd(32, "8")}` : undefined };
      addReceipt(receipt); setPhase("result");
    }, 1350);
  };

  return <AppShell title="Spend gate" eyebrow="Decision workspace" action={<MetaPill><span className="status-dot" /> Demo mode</MetaPill>}>
    <div className="gate-layout">
      <section className="surface gate-form">
        <div className="section-head"><div><h2>Proposed transfer</h2><p>Test the policy before any side effect can run.</p></div><span className="network-pill">Base Sepolia · Testnet</span></div>
        <div className="preset-row"><Button variant="outline" onClick={() => loadPreset("DENY")}><XCircle /> Load $50 deny</Button><Button variant="outline" onClick={() => loadPreset("ALLOW")}><CheckCircle2 /> Load $2 allow</Button></div>
        <label className="field"><span>Transfer intent</span><input defaultValue="Pay contractor for completed design sprint" /></label>
        <div className="field-grid"><label className="field"><span>Amount · USDC</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></label><label className="field"><span>Recipient</span><input value={recipient} onChange={(e) => setRecipient(e.target.value)} /></label></div>
        <label className="check-row"><input type="checkbox" checked={known} onChange={(e) => setKnown(e.target.checked)} /><span><strong>Recipient is allowlisted</strong><small>Known vendor in the active policy</small></span></label>
        <div className="policy-preview"><ShieldCheck /><div><small>Active policy · v1.4</small><p>Never send more than $5 or to unknown addresses. Abstain when recipient confidence is low.</p></div></div>
        <Button size="lg" className="evaluate-btn" disabled={phase === "evaluating"} onClick={evaluate}>{phase === "evaluating" ? "Evaluating policy…" : <>Prove before transfer <ArrowRight /></>}</Button>
      </section>
      <section className="surface evaluation">
        <div className="section-head"><div><h2>Decision trace</h2><p>Every required proof must pass.</p></div>{phase === "result" && <span className={`decision decision--${decision.toLowerCase()}`}>{decision === "ALLOW" ? <CheckCircle2 /> : <XCircle />}{decision}</span>}</div>
        <TraceStep index="01" title="SERV Multipath" detail="Policy and intent evaluated across reasoning paths." state={phase === "form" ? "idle" : "pass"} />
        <TraceStep index="02" title="Shadow Agent" detail={decision === "DENY" && phase === "result" ? `Amount exceeds $5 cap${known ? "" : " and recipient is unknown"}.` : "Numeric cap and allowlist independently checked."} state={phase === "form" ? "idle" : phase === "evaluating" ? "running" : decision === "ALLOW" ? "pass" : "fail"} />
        <TraceStep index="03" title="PromptGuard" detail="Structured output checked before code can continue." state={phase === "form" ? "idle" : phase === "evaluating" ? "idle" : "pass"} />
        <TraceStep index="04" title="AgentKit transfer" detail={phase === "result" && decision === "ALLOW" ? "Simulated transaction appended to receipt." : "Locked until every proof returns ALLOW."} state={phase === "result" ? decision === "ALLOW" ? "pass" : "locked" : "locked"} />
        {phase === "result" && <div className={decision === "ALLOW" ? "result-callout is-allow" : "result-callout is-deny"}><strong>{decision === "ALLOW" ? "Transfer allowed" : "Transfer refused"}</strong><p>{decision === "ALLOW" ? "A simulated Base Sepolia transaction and public receipt were created." : "No transaction was created. The denial receipt records exactly why."}</p><Button asChild variant="outline"><Link to="/receipts">View receipt <ChevronRight /></Link></Button></div>}
      </section>
    </div>
  </AppShell>;
}

function TraceStep({ index, title, detail, state }: { index: string; title: string; detail: string; state: "idle" | "running" | "pass" | "fail" | "locked" }) {
  return <div className={`trace-step trace-step--${state}`}><span className="trace-index">{state === "pass" ? <Check /> : state === "fail" ? <XCircle /> : state === "locked" ? <LockKeyhole /> : index}</span><div><strong>{title}</strong><p>{detail}</p></div><small>{state === "running" ? "Checking" : state === "pass" ? "Passed" : state === "fail" ? "Failed" : state === "locked" ? "Locked" : "Waiting"}</small></div>;
}

export function ReceiptsPage() {
  const { receipts } = useProofDemo(); const [query, setQuery] = useState(""); const [filter, setFilter] = useState<"ALL" | Decision>("ALL"); const [selected, setSelected] = useState<Receipt | null>(null);
  const visible = receipts.filter((r) => (filter === "ALL" || r.decision === filter) && `${r.id} ${r.recipient}`.toLowerCase().includes(query.toLowerCase()));
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); };
  return <AppShell title="Receipts" eyebrow="Decision ledger" action={<Button asChild><Link to="/gate"><Plus /> New check</Link></Button>}>
    <section className="surface ledger">
      <div className="ledger-tools"><label className="search-field"><Search /><input placeholder="Search receipt or recipient" value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="filter-tabs"><Filter />{(["ALL", "ALLOW", "DENY"] as const).map((item) => <Button key={item} variant={filter === item ? "default" : "ghost"} size="sm" onClick={() => setFilter(item)}>{item}</Button>)}</div></div>
      <div className="receipt-table"><div className="receipt-table__head"><span>Decision</span><span>Receipt</span><span>Amount</span><span>Shadow</span><span>Latency</span><span>Created</span><span /></div>{visible.map((receipt) => <button key={receipt.id} className="receipt-row" onClick={() => setSelected(receipt)}><span><i className={`status-mark status-mark--${receipt.decision.toLowerCase()}`} />{receipt.decision}</span><code>{receipt.id}</code><strong>${receipt.amount.toFixed(2)}</strong><span>{receipt.shadow}</span><span>{receipt.latency} ms</span><span>{receipt.createdAt}</span><ChevronRight /></button>)}</div>
      {!visible.length && <div className="empty-state"><FileCheck2 /><h3>No receipts match</h3><p>Try a different search or decision filter.</p></div>}
    </section>
    {selected && <div className="drawer-wrap"><button className="drawer-scrim" aria-label="Close receipt" onClick={() => setSelected(null)} /><aside className="receipt-drawer"><div className="drawer-head"><p className="page-eyebrow">Decision receipt</p><Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Close"><XCircle /></Button></div><span className={`decision decision--${selected.decision.toLowerCase()}`}>{selected.decision === "ALLOW" ? <CheckCircle2 /> : <XCircle />}{selected.decision}</span><h2>{selected.decision === "ALLOW" ? "Policy proof passed." : "Spend stopped safely."}</h2><p className="drawer-copy">This simulated receipt records the full decision path. {selected.decision === "DENY" ? "No transaction exists." : "A testnet transaction was appended."}</p><dl className="receipt-detail"><div><dt>Receipt ID</dt><dd>{selected.id}<Button variant="ghost" size="icon" onClick={() => copy(selected.id)}><Copy /></Button></dd></div><div><dt>Amount</dt><dd>${selected.amount.toFixed(2)} USDC</dd></div><div><dt>Recipient</dt><dd>{selected.recipient}</dd></div><div><dt>Prompt version</dt><dd>policy-v1.4</dd></div><div><dt>Shadow outcome</dt><dd>{selected.shadow}</dd></div><div><dt>Latency / cost</dt><dd>{selected.latency} ms · ${selected.cost}</dd></div>{selected.tx && <div><dt>Simulated tx</dt><dd className="tx-line">{selected.tx}<Button variant="ghost" size="icon" onClick={() => copy(selected.tx ?? "")}><Copy /></Button></dd></div>}</dl></aside></div>}
  </AppShell>;
}

export function PoliciesPage() {
  const [cap, setCap] = useState(5); const [abstain, setAbstain] = useState(true); const [saved, setSaved] = useState(false);
  return <AppShell title="Policies" eyebrow="Control library" action={<Button onClick={() => { setSaved(true); toast.success("Policy saved for this demo"); }}><Check /> {saved ? "Saved" : "Save policy"}</Button>}>
    <div className="policies-layout"><section className="surface policy-list"><div className="section-head"><div><h2>Policy library</h2><p>One active rule controls the demo.</p></div><Button variant="outline" size="icon" aria-label="Add policy"><Plus /></Button></div><button className="policy-card is-active"><span className="status-dot" /><div><strong>Contractor payouts</strong><small>Active · v1.4</small></div><ChevronRight /></button><button className="policy-card"><span className="status-dot is-muted" /><div><strong>Tool subscriptions</strong><small>Draft · v0.3</small></div><ChevronRight /></button></section>
    <section className="surface policy-editor"><div className="section-head"><div><p className="page-eyebrow">Contractor payouts · v1.4</p><h2>Fail-closed spend rules</h2></div><MetaPill>Active</MetaPill></div><label className="field"><span>Policy name</span><input defaultValue="Contractor payouts" /></label><label className="field"><span>Maximum transfer · USDC</span><input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} /></label><label className="field"><span>Allowlisted recipients</span><textarea defaultValue={`0x2F8B91C0 — Design contractor\n0x4C01B822 — Infrastructure vendor`} /></label><label className="check-row"><input type="checkbox" checked={abstain} onChange={(e) => setAbstain(e.target.checked)} /><span><strong>Abstain on uncertainty</strong><small>Any ambiguous result becomes DENY.</small></span></label><div className="compiled-policy"><small>Compiled natural-language policy</small><p>Never send more than <strong>${cap}</strong> or to unknown addresses. {abstain ? "Abstain when recipient confidence is low." : "Proceed when recipient confidence is low."}</p></div></section></div>
  </AppShell>;
}

const trend = [{ day: "Mon", allowed: 9, denied: 4 }, { day: "Tue", allowed: 12, denied: 6 }, { day: "Wed", allowed: 8, denied: 8 }, { day: "Thu", allowed: 15, denied: 5 }, { day: "Fri", allowed: 18, denied: 7 }, { day: "Sat", allowed: 11, denied: 3 }, { day: "Sun", allowed: 16, denied: 4 }];
export function AnalyticsPage() {
  const { receipts } = useProofDemo(); const blocked = receipts.filter((r) => r.decision === "DENY").reduce((sum, r) => sum + r.amount, 0); const allowed = receipts.filter((r) => r.decision === "ALLOW").length;
  return <AppShell title="Analytics" eyebrow="Policy performance" action={<MetaPill>Simulated data</MetaPill>}><div className="metric-grid"><Metric label="Evaluated spend" value={`$${receipts.reduce((s, r) => s + r.amount, 0).toFixed(2)}`} note={`${receipts.length} decisions`} icon={<CircleDollarSign />} /><Metric label="Blocked value" value={`$${blocked.toFixed(2)}`} note="Stopped before chain" icon={<LockKeyhole />} /><Metric label="Allow rate" value={`${Math.round((allowed / receipts.length) * 100)}%`} note="Within active policy" icon={<ShieldCheck />} /><Metric label="Median latency" value="781 ms" note="SERV decision path" icon={<Clock3 />} /></div><section className="surface chart-panel"><div className="section-head"><div><h2>Decision volume</h2><p>Last seven demo days · ALLOW versus DENY.</p></div><div className="chart-legend"><span><i className="legend-allow" /> Allowed</span><span><i className="legend-deny" /> Denied</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="allowFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-allow)" stopOpacity={0.32}/><stop offset="100%" stopColor="var(--chart-allow)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="allowed" stroke="var(--chart-allow)" fill="url(#allowFill)" strokeWidth={2}/><Area type="monotone" dataKey="denied" stroke="var(--chart-deny)" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></section></AppShell>;
}
function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) { return <div className="surface metric"><span className="metric__icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{note}</small></div>; }

export function IntegrationsPage() {
  const integrations = [{ name: "SERV Reasoning", desc: "Multipath decision engine with Shadow Agent and PromptGuard.", status: "Demo connected", icon: <Sparkles />, tone: "live" }, { name: "AgentKit / CDP", desc: "Transfer execution after a structured ALLOW decision.", status: "Simulated", icon: <CircleDollarSign />, tone: "demo" }, { name: "Base Sepolia", desc: "Explicitly labeled testnet destination for demo receipts.", status: "Testnet", icon: <ExternalLink />, tone: "demo" }, { name: "IXS Vault", desc: "Phase two only. API access has not been verified.", status: "Parked", icon: <LockKeyhole />, tone: "parked" }, { name: "RH MCP", desc: "Access unverified and intentionally outside the submission path.", status: "Parked", icon: <CableIcon />, tone: "parked" }];
  return <AppShell title="Integrations" eyebrow="Decision infrastructure" action={<MetaPill>No live credentials</MetaPill>}><div className="integration-grid">{integrations.map((item) => <section className="surface integration-card" key={item.name}><div className="integration-icon">{item.icon}</div><div><h2>{item.name}</h2><p>{item.desc}</p></div><span className={`integration-status is-${item.tone}`}>{item.status}</span><Button variant="outline" disabled={item.tone === "parked"}>{item.tone === "parked" ? "Unavailable" : "View configuration"}</Button></section>)}</div></AppShell>;
}
function CableIcon() { return <FileCheck2 />; }

export function SettingsPage() {
  const { publicReceipts, setPublicReceipts } = useProofDemo(); const [failClosed, setFailClosed] = useState(true);
  return <AppShell title="Settings" eyebrow="Demo organization" action={<Button onClick={() => toast.success("Settings saved for this demo")}><Check /> Save changes</Button>}><div className="settings-stack"><section className="surface settings-section"><div className="section-head"><div><h2>Organization</h2><p>Identity shown across demo receipts.</p></div></div><div className="field-grid"><label className="field"><span>Organization name</span><input defaultValue="PROOF Demo Lab" /></label><label className="field"><span>Build base</span><input defaultValue="Accra, Ghana" /></label></div></section><section className="surface settings-section"><div className="section-head"><div><h2>Safety defaults</h2><p>Guardrails are designed to stop closed, not fail open.</p></div></div><SettingToggle checked={failClosed} onChange={setFailClosed} title="Fail closed on any error" detail="Blocks side effects when reasoning, schema, or guard checks fail." /><SettingToggle checked={publicReceipts} onChange={setPublicReceipts} title="Public demo receipts" detail="Makes non-sensitive decision evidence shareable in this browser session." /></section><section className="surface disclosure"><LockKeyhole /><div><h2>Honest demo boundary</h2><p>All activity in this product is simulated. Base Sepolia is a test network. No mainnet funds move, and this is not financial advice.</p></div></section></div></AppShell>;
}
function SettingToggle({ checked, onChange, title, detail }: { checked: boolean; onChange: (value: boolean) => void; title: string; detail: string }) { return <label className="setting-toggle"><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i /></label>; }