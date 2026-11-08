import { createFileRoute } from "@tanstack/react-router";
import { AuditTrail } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [
    { title: "Audit Trail | EnHM Management System" },
    { name: "description", content: "Demonstration audit trail of sample EnHM workflow actions." },
    { property: "og:title", content: "Audit Trail | EnHM Management System" },
    { property: "og:description", content: "Workflow accountability trail for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuditTrail,
});