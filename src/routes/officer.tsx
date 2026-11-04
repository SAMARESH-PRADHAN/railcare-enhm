import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/officer")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
