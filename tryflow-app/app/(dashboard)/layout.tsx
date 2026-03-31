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

  const { data: creditData } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  const creditBalance = creditData?.balance ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar
        userName={user.user_metadata?.full_name ?? user.email ?? "User"}
        userImage={user.user_metadata?.avatar_url}
        creditBalance={creditBalance}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
