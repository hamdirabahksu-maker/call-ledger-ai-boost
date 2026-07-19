import { createFileRoute, redirect } from "@tanstack/react-router";

// Convenience redirect: /onboarding -> gated /app onboarding
export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    throw redirect({ to: "/_authenticated/onboarding" as never });
  },
  component: () => null,
});
