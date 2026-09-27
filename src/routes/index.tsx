import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/proof-pages";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PROOF — Policy passed. Then money moves." },
      {
        name: "description",
        content: "Fail-closed policy proof for AgentKit spend, powered by SERV reasoning.",
      },
      { property: "og:title", content: "PROOF — Policy passed. Then money moves." },
      { property: "og:description", content: "Fail-closed policy proof before agent spend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
