import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/clerk")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
