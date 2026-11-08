import { createFileRoute } from "@tanstack/react-router";
import { ActivityDetail } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/activities/$activityId")({
  head: ({ params }) => ({ meta: [
    { title: `Activity ${params.activityId} | EnHM Management System` },
    { name: "description", content: "Activity description and demonstration records for the EnHM management system." },
    { property: "og:title", content: `Activity ${params.activityId} | EnHM Management System` },
    { property: "og:description", content: "Activity status and sample operational records in the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ActivityDetailRoute,
});

function ActivityDetailRoute() {
  const { activityId } = Route.useParams();
  return <ActivityDetail activityId={activityId} />;
}