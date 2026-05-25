// Fastlane 데모 단계: 로그인 강제 redirect 제거.
// 2026-05: TopBar 제거 — "새 대회" 버튼 하나만 있어서 사이드바 메뉴/하단 CTA 와
// 중복. sticky 상단 헤더 자리만 차지하던 빈 헤더라 통째로 제거.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--page-bg)" }}>
      <main className="flex-1">{children}</main>
    </div>
  );
}
