import { Skeleton } from "@/components/ui/Skeleton";

export default function CompareLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* PageHeader skeleton */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-20" muted />
          </div>
          <Skeleton className="h-4 w-[32rem] max-w-full" muted />
        </div>
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>

      {/* A/B dock */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-6">
        <DockSlot />
        <DockSlot />
        <Skeleton className="h-[68px] w-32" />
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40" />
      </div>

      <Skeleton className="h-3 w-32 mb-3" muted />

      {/* Ideas grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <CompareCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function DockSlot() {
  return (
    <div
      className="flex items-center gap-3 p-3.5 border min-h-[68px]"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      <Skeleton className="w-8 h-8 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-24" muted />
        <Skeleton className="h-4 w-40" muted />
      </div>
    </div>
  );
}

function CompareCardSkeleton() {
  return (
    <div
      className="border p-4"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-20" muted />
          <Skeleton className="h-3 w-14" muted />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" muted />
      <Skeleton className="h-3 w-5/6 mb-3" muted />
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-16" muted />
        <Skeleton className="h-3 w-14" muted />
      </div>
    </div>
  );
}
