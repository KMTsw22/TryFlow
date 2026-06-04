// 출품 상세 로딩 placeholder. 종합 점수 hero + AI 종합 평가 + 심사 작업
// 3 섹션의 형태에 맞춰 회색 박스로 노출.

import { Skeleton } from "@/components/ui/Skeleton";

export default function ProposalDetailLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      <Skeleton className="h-4 w-40 mb-6" muted />

      {/* 출품 메타 — 상태칩 + 제목 + 메타 strip */}
      <div className="pb-6 mb-6 border-b" style={{ borderColor: "var(--t-border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-20" muted />
          <Skeleton className="h-4 w-24" muted />
        </div>
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-8 w-16" muted />
          <Skeleton className="h-8 w-20" muted />
        </div>
        <Skeleton className="h-4 w-2/3 max-w-lg" muted />
      </div>

      {/* 종합 점수 hero */}
      <section className="mb-10">
        <Skeleton className="h-4 w-1/2 max-w-md mb-4" muted />
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-x-10 gap-y-4 items-end pb-8 border-b" style={{ borderColor: "var(--t-border-subtle)" }}>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" muted />
            <Skeleton className="h-16 w-32" />
          </div>
          <div className="space-y-2 md:pl-10 md:border-l" style={{ borderColor: "var(--t-border-subtle)" }}>
            <Skeleton className="h-3 w-20" muted />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-3 w-40" muted />
          </div>
          <Skeleton className="h-24 w-44" muted />
        </div>
      </section>

      {/* AI 종합 평가 markdown */}
      <section className="mb-12 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-3/4 max-w-xl" muted />
        <Skeleton className="h-24 w-full" muted />
      </section>

      {/* 심사 작업 — axis 행 5개 */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-24 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </section>
    </div>
  );
}
