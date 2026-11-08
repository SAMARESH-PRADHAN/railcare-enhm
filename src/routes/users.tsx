import { createFileRoute } from "@tanstack/react-router";
import { UsersDirectory } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [
    { title: "Users Directory | EnHM Management System" },
    { name: "description", content: "Sample personnel directory and assignment scope for the EnHM demonstration system." },
    { property: "og:title", content: "Users Directory | EnHM Management System" },
    { property: "og:description", content: "Fictional user roster for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: UsersDirectory,
});