import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";

// Fastlane 데모 단계: 로그인 강제 redirect 제거.
// 게스트는 user_metadata 가 없으니 기본 라벨 ("게스트") 로 표시.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName =
    user?.user_metadata?.full_name ?? user?.email ?? "게스트";
  const userImage = user?.user_metadata?.avatar_url;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--page-bg)" }}>
      <TopBar userName={userName} userImage={userImage} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
