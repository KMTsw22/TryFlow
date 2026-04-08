import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <div className="flex flex-col min-h-screen" style={{ background: "#050816" }}>
      <TopBar
        userName={user.user_metadata?.full_name ?? user.email ?? "User"}
        userImage={user.user_metadata?.avatar_url}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}