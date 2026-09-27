import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "@/components/proof-pages";
export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Spend Policies — PROOF" },
      {
        name: "description",
        content: "Define amount caps, recipient allowlists, and fail-closed behavior.",
      },
      { property: "og:title", content: "Spend Policies — PROOF" },
      { property: "og:description", content: "Procurement-grade rules for agent spend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoliciesPage,
});
