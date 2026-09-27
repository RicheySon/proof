import { createFileRoute } from "@tanstack/react-router";
import { ReceiptsPage } from "@/components/proof-pages";
export const Route = createFileRoute("/receipts")({
  head: () => ({
    meta: [
      { title: "Decision Receipts — PROOF" },
      {
        name: "description",
        content: "Review ALLOW and DENY receipts with policy evidence and transaction status.",
      },
      { property: "og:title", content: "Decision Receipts — PROOF" },
      { property: "og:description", content: "Verifiable proof for every agent spend decision." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptsPage,
});
