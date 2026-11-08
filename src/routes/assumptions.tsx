import { createFileRoute } from "@tanstack/react-router";
import { AssumptionsPage } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/assumptions")({
  head: () => ({ meta: [
    { title: "Requirements Decisions | EnHM Management System" },
    { name: "description", content: "Nine pending workflow and policy decisions for the EnHM client demonstration." },
    { property: "og:title", content: "Requirements Decisions | EnHM Management System" },
    { property: "og:description", content: "Assumptions and client discussion points for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AssumptionsPage,
});