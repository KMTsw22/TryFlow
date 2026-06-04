// 결과 페이지 발표회 hero + podium + 표 형태의 skeleton.

import { Skeleton } from "@/components/ui/Skeleton";

export default function ResultsLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <header
        className="sticky top-0 z-10 h-14 flex items-center justify-between px-8"
        style={{
          background: "rgba(255,255,255,0.94)",
          borderBottom: "1px solid var(--t-border)",
        }}
      >
        <Skeleton className="h-6 w-24" muted />
        <Skeleton className="h-4 w-16" muted />
      </header>

      <main className="max-w-[1100px] mx-auto px-8 pt-14 pb-20">
        {/* Hero */}
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-4 w-32 mx-auto" muted />
          <Skeleton className="h-12 w-3/4 max-w-2xl mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" muted />
        </div>

        {/* Meta cards */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>

        {/* Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>

        {/* Table */}
        <Skeleton className="h-64 w-full" muted />
      </main>
    </div>
  );
}
