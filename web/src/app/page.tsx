import { currentUser } from "@/lib/auth";
import Dashboard from "@/components/dashboard";
import PublicHome from "@/components/public-home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (!user) return <PublicHome />;
  return <Dashboard initialUser={{ id: user.id, name: user.name, role: user.role, location: user.location?.name ?? "All locations" }} />;
}
