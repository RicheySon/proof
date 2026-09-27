import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/login-page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — PROOF" },
      {
        name: "description",
        content:
          "Sign back into your PROOF workspace with the recovery key you saved when protecting the session.",
      },
      { property: "og:title", content: "Sign in — PROOF" },
    ],
  }),
  component: LoginPage,
});
