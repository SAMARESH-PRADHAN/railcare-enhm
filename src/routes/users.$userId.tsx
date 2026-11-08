import { createFileRoute } from "@tanstack/react-router";
import { UserProfile } from "@/components/dashboard/reference-pages";

export const Route = createFileRoute("/users/$userId")({
  head: () => ({ meta: [
    { title: "User Profile | EnHM Management System" },
    { name: "description", content: "Personnel and assignment profile in the EnHM demonstration system." },
    { property: "og:title", content: "User Profile | EnHM Management System" },
    { property: "og:description", content: "Fictional personnel profile for the EnHM demonstration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: UserProfileRoute,
});

function UserProfileRoute() {
  const { userId } = Route.useParams();
  return <UserProfile userId={userId} />;
}