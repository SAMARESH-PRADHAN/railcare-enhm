import { createFileRoute } from "@tanstack/react-router";
import { ContractAlerts } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/contracts")({
  head: () => ({ meta: [
    { title: "Contract Alerts | EnHM Management System" },
    { name: "description", content: "Sample contract expiry alerts and statuses for EnHM activity 9." },
    { property: "og:title", content: "Contract Alerts | EnHM Management System" },
    { property: "og:description", content: "Long-term contract expiry overview for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ContractAlerts,
});