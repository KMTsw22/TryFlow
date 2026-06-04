// 대회 상세(리더보드) 로딩 placeholder.
// 서버 컴포넌트가 fetch 하는 동안 빈 화면 대신 표시되어 체감 속도 개선.

import { Skeleton } from "@/components/ui/Skeleton";

export default function CompetitionDetailLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-10 pt-8 pb-20">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-32 mb-6" muted />

      {/* Header — kicker + 제목 + 메타 */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-3 w-24" muted />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" muted />
      </div>

      {/* Stage stepper */}
      <Skeleton className="h-16 w-full mb-8" muted />

      {/* Leaderboard skeleton — 5 rows */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" muted />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
