import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Cable, FileCheck2, Menu, Settings, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ProofLogo } from "./proof-logo";
import { Button } from "./ui/button";

const items = [
  { to: "/gate" as const, label: "Spend gate", icon: ShieldCheck },
  { to: "/receipts" as const, label: "Receipts", icon: FileCheck2 },
  { to: "/policies" as const, label: "Policies", icon: ShieldCheck },
  { to: "/analytics" as const, label: "Analytics", icon: BarChart3 },
  { to: "/integrations" as const, label: "Integrations", icon: Cable },
  { to: "/settings" as const, label: "Settings", icon: Settings },
];

export function AppShell({ title, eyebrow, action, children }: { title: string; eyebrow: string; action?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar is-open" : "sidebar"}>
        <div className="sidebar__brand"><Link to="/" onClick={() => setOpen(false)}><ProofLogo /></Link><Button variant="ghost" size="icon" className="sidebar__close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></Button></div>
        <nav className="sidebar__nav" aria-label="Product navigation">
          {items.map(({ to, label, icon: Icon }) => <Link key={to} to={to} onClick={() => setOpen(false)} className={pathname === to ? "sidebar__link is-active" : "sidebar__link"}><Icon /> <span>{label}</span></Link>)}
        </nav>
        <div className="sidebar__foot"><span className="status-dot" /> Demo systems operational<br /><small>Base Sepolia · Testnet</small></div>
      </aside>
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <main className="workspace">
        <header className="workspace__header">
          <Button variant="outline" size="icon" className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></Button>
          <div><p className="page-eyebrow">{eyebrow}</p><h1>{title}</h1></div>
          <div className="workspace__action">{action}</div>
        </header>
        <div className="workspace__body">{children}</div>
      </main>
    </div>
  );
}

export function MetaPill({ children }: { children: ReactNode }) { return <span className="meta-pill">{children}</span>; }