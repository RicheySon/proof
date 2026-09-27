import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ProofLogo } from "./proof-logo";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-page__nav">
        <Link to="/" className="landing-nav__brand">
          <ProofLogo />
        </Link>
        <nav aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/gate">Run the gate</Link>
        </nav>
      </header>
      <article className="legal-page__body">
        <p className="page-eyebrow">Legal · Updated {updated}</p>
        <h1>{title}</h1>
        {children}
      </article>
      <footer className="site-footer">
        <Link to="/">PROOF</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <span>Base Sepolia · Not financial advice</span>
      </footer>
    </div>
  );
}
