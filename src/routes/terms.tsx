import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use · PROOF" },
      {
        name: "description",
        content:
          "Terms for using PROOF: Base Sepolia testnet only, fail-closed spend gate, no financial advice.",
      },
      { property: "og:title", content: "Terms of Use · PROOF" },
      {
        property: "og:description",
        content: "Testnet demo terms for the PROOF spend gate.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms of Use" updated="27 Sep 2026">
      <p>
        By using PROOF (the “Service”), you agree to these terms. If you do not agree, do not use the
        Service.
      </p>

      <h2>What PROOF is</h2>
      <p>
        PROOF is a fail-closed policy proof layer in front of agent spend. It evaluates intents with
        SERV Reasoning and a deterministic code gate, and may submit Base Sepolia USDC transfers via
        Coinbase CDP when policy allows. It is a <strong>testnet demonstration</strong>, not a
        production bank, broker, or custodian.
      </p>

      <h2>Not financial advice</h2>
      <p>
        Nothing in the Service is investment, legal, or tax advice. On-chain transfers on Base Sepolia
        use test assets with no real-world cash value. Do not send mainnet funds expecting PROOF to
        protect them unless you have independently audited and deployed your own production stack.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not attempt to bypass fail-closed controls or flood the evaluate API.</li>
        <li>Do not submit unlawful content in intents or policy text.</li>
        <li>Do not scrape or abuse third-party APIs through our keys.</li>
        <li>Keep your own API keys secret; never paste them into client forms.</li>
      </ul>

      <h2>Availability and data</h2>
      <p>
        The Service is provided “as is.” Sessions and receipts may reset when serverless instances
        recycle. We may change or discontinue features without notice during the hackathon demo
        period.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the authors are not liable for lost profits, lost
        data, failed transfers, or damages arising from use of the Service or reliance on receipts.
      </p>

      <h2>Privacy</h2>
      <p>
        See the <Link to="/privacy">Privacy Policy</Link> for cookies and data practices.
      </p>
    </LegalShell>
  );
}
