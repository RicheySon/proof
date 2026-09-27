import { createFileRoute } from "@tanstack/react-router";
import { ReviewPage } from "@/components/proof-pages";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Policy Review — PROOF" },
      {
        name: "description",
        content: "Live SERV policy-risk analysis for agent spend controls.",
      },
      { property: "og:title", content: "Policy Review — PROOF" },
      {
        property: "og:description",
        content: "Structured risk review before agent spend ships.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});
