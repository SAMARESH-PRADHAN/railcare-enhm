import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [
    { title: "Reports Overview | EnHM Management System" },
    { name: "description", content: "Compact station and activity reporting summaries for the EnHM demonstration." },
    { property: "og:title", content: "Reports Overview | EnHM Management System" },
    { property: "og:description", content: "Frontend demonstration summaries, not official railway reports." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ReportsPage,
});