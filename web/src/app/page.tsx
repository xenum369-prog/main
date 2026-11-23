import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Dashboard from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <Dashboard initialUser={{ id: user.id, name: user.name, role: user.role, location: user.location?.name ?? "All locations" }} />;
}
