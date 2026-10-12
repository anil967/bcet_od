import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/premium")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
