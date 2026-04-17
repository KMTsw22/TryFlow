import { Skeleton } from "@/components/ui/Skeleton";

export default function MarketLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar skeleton */}
      <div
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ borderColor: "var(--t-border)" }}
      >
        <Skeleton className="h-7 w-24" muted />
        <Skeleton className="h-8 w-28" muted />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* PageHeader */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-[40rem] max-w-full" muted />
        </div>

        {/* Signal strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <SignalSkeleton key={i} />
          ))}
        </div>

        {/* Category table header */}
        <div className="mb-4 space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" muted />
        </div>

        {/* Table skeleton */}
        <div
          className="border overflow-hidden"
          style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
        >
          {/* Header row */}
          <div
            className="grid items-center gap-4 px-5 py-3 border-b"
            style={{
              borderColor: "var(--t-border)",
              gridTemplateColumns: "minmax(0, 1.4fr) 80px 80px 90px 120px minmax(0, 1fr) 100px 24px",
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" muted />
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: "var(--t-border-subtle)" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="grid items-center gap-4 px-5 py-4"
                style={{
                  gridTemplateColumns: "minmax(0, 1.4fr) 80px 80px 90px 120px minmax(0, 1fr) 100px 24px",
                }}
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-10 ml-auto" muted />
                <Skeleton className="h-4 w-10 ml-auto" muted />
                <Skeleton className="h-4 w-12 ml-auto" muted />
                <Skeleton className="h-4 w-20" muted />
                <Skeleton className="h-[22px] w-[110px]" muted />
                <Skeleton className="h-4 w-16" muted />
                <Skeleton className="h-4 w-4" muted />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalSkeleton() {
  return (
    <div
      className="flex flex-col p-5 border"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--t-border-card)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-3 w-28" muted />
        <Skeleton className="h-4 w-4" muted />
      </div>
      <Skeleton className="h-6 w-36 mb-2" />
      <Skeleton className="h-4 w-40" muted />
      <Skeleton className="h-3 w-24 mt-1.5" muted />
    </div>
  );
}
