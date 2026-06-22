import { createFileRoute, redirect } from "@tanstack/react-router";

// Suggestions now live at the bottom of the profile page.
export const Route = createFileRoute("/utilities")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
  component: () => null,
});
