import { createFileRoute } from "@tanstack/react-router";
import { StationsDirectory } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/stations")({
  head: () => ({ meta: [
    { title: "Stations Directory | EnHM Management System" },
    { name: "description", content: "Sample station directory and reporting scope for the EnHM demonstration system." },
    { property: "og:title", content: "Stations Directory | EnHM Management System" },
    { property: "og:description", content: "Station assignment and reporting directory for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: StationsDirectory,
});