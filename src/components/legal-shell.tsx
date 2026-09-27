import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ProofLogo } from "./proof-logo";

export function LegalShell({
  title,
  updated,
  kind = "legal",
  children,
}: {
  title: string;
  updated: string;
  kind?: "legal" | "auth";
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-page__nav">
        <Link to="/" className="landing-nav__brand">
          <ProofLogo />
        </Link>
        <nav aria-label={kind === "auth" ? "Account" : "Legal"}>
          <Link to="/login">Sign in</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/gate">Run the gate</Link>
        </nav>
      </header>
      <article className="legal-page__body">
        <p className="page-eyebrow">
          {kind === "auth" ? `Auth · ${updated}` : `Legal · Updated ${updated}`}
        </p>
        <h1>{title}</h1>
        {children}
      </article>
      <footer className="site-footer">
        <Link to="/">PROOF</Link>
        <Link to="/login">Sign in</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <span>Base Sepolia · Not financial advice</span>
      </footer>
    </div>
  );
}
