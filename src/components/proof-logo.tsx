import seal from "@/assets/proof-seal-mark.png";

export function ProofLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="proof-logo" aria-label="PROOF">
      <img
        src={seal}
        width={128}
        height={128}
        alt=""
        className="proof-logo__seal"
        decoding="async"
      />
      {!compact && <span className="proof-logo__type">PROOF</span>}
    </span>
  );
}

