import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/ui-bits";
import { ReportsOverview } from "@/components/dashboard/reports-overview";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [
    { title: "Reports Overview | Admin | EnHM Management System" },
    { name: "description", content: "Sample station reporting, activity status, verification and contract summaries." },
    { property: "og:title", content: "Reports Overview | Admin | EnHM Management System" },
    { property: "og:description", content: "Frontend demonstration reports, not official railway reports." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <div>
      <PageHeader
        kicker="Admin · Demonstration preview"
        title="Reports Overview"
        description="Compact operational summaries for presentation. These are frontend demonstration previews, not official railway reports."
      />
      <ReportsOverview />
    </div>
  ),
});
