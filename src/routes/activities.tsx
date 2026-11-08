import { createFileRoute } from "@tanstack/react-router";
import { ActivityCatalogue } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/activities")({
  head: () => ({ meta: [
    { title: "Activity Catalogue | EnHM Management System" },
    { name: "description", content: "The 31 EnHM department activity catalogue, with two live demonstration workflows." },
    { property: "og:title", content: "Activity Catalogue | EnHM Management System" },
    { property: "og:description", content: "Operational and upcoming activity scope for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ActivityCatalogue,
});