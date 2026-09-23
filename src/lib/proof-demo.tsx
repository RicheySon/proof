import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Decision = "ALLOW" | "DENY";
export type Receipt = {
  id: string;
  decision: Decision;
  amount: number;
  recipient: string;
  createdAt: string;
  latency: number;
  cost: number;
  shadow: "PASS" | "FAIL";
  tx?: string;
};

const seededReceipts: Receipt[] = [
  { id: "prf_8F2K1A", decision: "DENY", amount: 50, recipient: "0x7A91…E204", createdAt: "Today, 10:42", latency: 842, cost: 0.0031, shadow: "FAIL" },
  { id: "prf_6C9M4Q", decision: "ALLOW", amount: 2, recipient: "0x2F8B…91C0", createdAt: "Today, 10:38", latency: 716, cost: 0.0028, shadow: "PASS", tx: "0x8a74f2d39bd0c887a1f8d4e63c6f2c39" },
  { id: "prf_1R7V3N", decision: "ALLOW", amount: 4.5, recipient: "0x2F8B…91C0", createdAt: "Yesterday, 16:12", latency: 781, cost: 0.0029, shadow: "PASS", tx: "0x9b13e721a49628ce53a8a31d6f74240a" },
  { id: "prf_4T2J8L", decision: "DENY", amount: 12, recipient: "0x91C4…B702", createdAt: "Yesterday, 09:07", latency: 903, cost: 0.0034, shadow: "FAIL" },
];

type DemoContextValue = {
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  publicReceipts: boolean;
  setPublicReceipts: (value: boolean) => void;
};

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function ProofDemoProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>(seededReceipts);
  const [publicReceipts, setPublicReceipts] = useState(true);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("proof-demo-receipts");
    if (stored) {
      try {
        setReceipts(JSON.parse(stored) as Receipt[]);
      } catch {
        window.sessionStorage.removeItem("proof-demo-receipts");
      }
    }
  }, []);

  const value = useMemo(() => ({
    receipts,
    publicReceipts,
    setPublicReceipts,
    addReceipt: (receipt: Receipt) => {
      setReceipts((current) => {
        const next = [receipt, ...current];
        window.sessionStorage.setItem("proof-demo-receipts", JSON.stringify(next));
        return next;
      });
    },
  }), [receipts, publicReceipts]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useProofDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useProofDemo must be used inside ProofDemoProvider");
  return context;
}

export const shortAddress = "0x2F8B…91C0";