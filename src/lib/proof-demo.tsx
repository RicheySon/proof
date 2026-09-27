import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  evaluateSpend,
  getIntegrationStatus,
  getPolicies,
  getReceipts,
  savePolicy,
} from "@/lib/proof/server-fns";
import type { Policy, Receipt } from "@/lib/proof/types";
import { DEFAULT_POLICY } from "@/lib/proof/types";

export type Decision = "ALLOW" | "DENY";

type IntegrationStatus = Awaited<ReturnType<typeof getIntegrationStatus>>;

type ProofContextValue = {
  receipts: Receipt[];
  policies: Policy[];
  activePolicy: Policy;
  status: IntegrationStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  evaluate: (input: {
    amountUsd: number;
    recipient: string;
    intent: string;
    idempotencyKey: string;
  }) => Promise<Awaited<ReturnType<typeof evaluateSpend>>>;
  persistPolicy: (policy: Policy) => Promise<void>;
};

const ProofContext = createContext<ProofContextValue | undefined>(undefined);

export function ProofDemoProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([DEFAULT_POLICY]);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await getIntegrationStatus();
      setStatus(nextStatus);
      if (!nextStatus.sessionReady) {
        setError(nextStatus.sessionError ?? "Session not ready");
        setReceipts([]);
        return;
      }
      const [receiptResult, policyResult] = await Promise.all([getReceipts(), getPolicies()]);
      if (receiptResult.ok) setReceipts(receiptResult.receipts);
      else setError(receiptResult.message);
      if (policyResult.ok) setPolicies(policyResult.policies);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const evaluate = useCallback(
    async (input: {
      amountUsd: number;
      recipient: string;
      intent: string;
      idempotencyKey: string;
    }) => {
      const result = await evaluateSpend({ data: input });
      if (result.ok) {
        setReceipts((current) => [
          result.receipt,
          ...current.filter((r) => r.id !== result.receipt.id),
        ]);
      }
      return result;
    },
    [],
  );

  const persistPolicy = useCallback(async (policy: Policy) => {
    const result = await savePolicy({ data: policy });
    if (!result.ok) throw new Error(result.message);
    setPolicies((current) => {
      const idx = current.findIndex((p) => p.id === result.policy.id);
      if (idx < 0) return [...current, result.policy];
      const next = [...current];
      next[idx] = result.policy;
      return next;
    });
  }, []);

  const value = useMemo<ProofContextValue>(
    () => ({
      receipts,
      policies,
      activePolicy: policies[0] ?? DEFAULT_POLICY,
      status,
      loading,
      error,
      refresh,
      evaluate,
      persistPolicy,
    }),
    [receipts, policies, status, loading, error, refresh, evaluate, persistPolicy],
  );

  return <ProofContext.Provider value={value}>{children}</ProofContext.Provider>;
}

export function useProofDemo() {
  const context = useContext(ProofContext);
  if (!context) throw new Error("useProofDemo must be used inside ProofDemoProvider");
  return context;
}

export const shortAddress = "0x2F8B91C0";
