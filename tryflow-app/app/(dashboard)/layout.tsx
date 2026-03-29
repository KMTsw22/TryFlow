import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-[220px] min-h-screen overflow-auto">
        <TopBar
          userName={user.user_metadata?.full_name ?? user.email ?? "User"}
          userImage={user.user_metadata?.avatar_url}
        />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
