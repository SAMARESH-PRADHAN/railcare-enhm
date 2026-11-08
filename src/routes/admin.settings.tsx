import { createFileRoute } from "@tanstack/react-router";
import { DemoSettings } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [
    { title: "Demo Settings | EnHM Management System" },
    { name: "description", content: "Sample-data scope and reset controls for the EnHM demonstration." },
    { property: "og:title", content: "Demo Settings | EnHM Management System" },
    { property: "og:description", content: "Demonstration settings and sample data controls." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: DemoSettings,
});