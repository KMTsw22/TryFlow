import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* PageHeader skeleton */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-16" muted />
          </div>
          <Skeleton className="h-4 w-96 max-w-full" muted />
        </div>
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>

      {/* Ideas — hero + 2-col rest */}
      <div className="space-y-4">
        {/* Hero card */}
        <IdeaCardSkeleton hero />

        {/* 2-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IdeaCardSkeleton />
          <IdeaCardSkeleton />
        </div>
      </div>
    </div>
  );
}

function IdeaCardSkeleton({ hero = false }: { hero?: boolean }) {
  return (
    <div
      className="border p-6"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
        minHeight: hero ? 240 : 200,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" muted />
          <Skeleton className="h-4 w-14" muted />
        </div>
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      </div>
      {/* Body */}
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" muted />
      <Skeleton className="h-4 w-5/6 mb-4" muted />
      {hero && <Skeleton className="h-10 w-full mb-4" muted />}
      {/* Footer meta */}
      <div className="flex items-center gap-3 mt-4">
        <Skeleton className="h-4 w-20" muted />
        <Skeleton className="h-4 w-16" muted />
        <Skeleton className="h-4 w-16" muted />
      </div>
    </div>
  );
}
