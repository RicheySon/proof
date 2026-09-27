import seal from "@/assets/proof-seal-b.png";

export function ProofLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="proof-logo" aria-label="PROOF">
      <img src={seal} width={1024} height={1024} alt="" className="proof-logo__seal" />
      {!compact && <span className="proof-logo__type">PROOF</span>}
    </span>
  );
}
