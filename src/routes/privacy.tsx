import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · PROOF" },
      {
        name: "description",
        content:
          "How PROOF handles session cookies, spend receipts, and server-side API keys. No sale of personal data.",
      },
      { property: "og:title", content: "Privacy Policy · PROOF" },
      {
        property: "og:description",
        content: "Session cookies, receipts, and fail-closed data practices.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="27 Sep 2026">
      <p>
        PROOF is a fail-closed spend gate for AI agents. This page explains what we collect, why, and
        what we do <em>not</em> do. Contact: the project maintainers via the GitHub repository.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Session cookie (`proof_session`)</strong> — a signed httpOnly cookie that identifies
          your tenant workspace so receipts and policies stay separated. It is necessary for the
          product to work.
        </li>
        <li>
          <strong>Spend intents you submit</strong> — amount, recipient, intent text, and idempotency
          key, stored as receipts in server memory for your session.
        </li>
        <li>
          <strong>Consent preference (`proof_consent`)</strong> — whether you allowed optional
          analytics. Essential-only is the default until you choose.
        </li>
        <li>
          <strong>Optional analytics</strong> — if you accept analytics, we may record anonymous page
          views (path, referrer, coarse device). No advertising profiles.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>We do not put API keys, wallet secrets, or session tokens in the browser bundle.</li>
        <li>We do not use localStorage for auth or receipts.</li>
        <li>We do not sell personal data.</li>
        <li>We do not claim the product is unhackable or offer financial advice.</li>
      </ul>

      <h2>Third parties</h2>
      <p>
        Live evaluate calls may contact OpenServ SERV and Coinbase Developer Platform (CDP) from our
        server with secrets you configure. Those providers process request content under their own
        terms. Base Sepolia transfers are public on-chain.
      </p>

      <h2>Retention</h2>
      <p>
        In-memory receipts reset when the server instance recycles. Cookies expire after about seven
        days unless renewed by use. You can clear site data in your browser anytime.
      </p>

      <h2>Your choices</h2>
      <p>
        Use the cookie banner to accept or decline optional analytics. Declining keeps only the
        necessary session cookie. See also our <Link to="/terms">Terms</Link>.
      </p>
    </LegalShell>
  );
}
