import { Skeleton } from "@/components/ui/Skeleton";

export default function IdeaReportLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <div
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ borderColor: "var(--t-border)" }}
      >
        <Skeleton className="h-7 w-24" muted />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" muted />
          <Skeleton className="h-8 w-28" muted />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back link */}
        <Skeleton className="h-3 w-28 mb-5" muted />

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-3 w-24" muted />
          <Skeleton className="h-3 w-28" muted />
        </div>

        {/* H1 + description */}
        <Skeleton className="h-7 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full mb-1" muted />
        <Skeleton className="h-4 w-5/6 mb-8" muted />

        {/* Hero — 2-col */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px border overflow-hidden mb-6"
          style={{
            background: "var(--t-border-card)",
            borderColor: "var(--t-border-card)",
          }}
        >
          {/* Left — verdict + score */}
          <div className="p-7 space-y-4" style={{ background: "var(--card-bg)" }}>
            <Skeleton className="h-5 w-48" muted />
            <div className="flex items-start gap-5">
              <div className="space-y-2">
                <Skeleton className="h-14 w-24" />
                <Skeleton className="h-3 w-20" muted />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" muted />
                <Skeleton className="h-4 w-5/6" muted />
                <Skeleton className="h-4 w-4/6" muted />
              </div>
            </div>
            <Skeleton className="h-4 w-32 mt-4" muted />
          </div>
          {/* Right — mini radar + dims */}
          <div className="p-6 space-y-3" style={{ background: "var(--card-bg)" }}>
            <Skeleton className="h-3 w-32" muted />
            <Skeleton className="h-[150px] w-full" muted />
            <Skeleton className="h-4 w-full" muted />
            <Skeleton className="h-4 w-full" muted />
          </div>
        </div>

        {/* Action dock — 4 buttons */}
        <div className="mb-6">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" muted />
            ))}
          </div>
        </div>

        {/* Sections below */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border p-6 mb-4"
            style={{ background: "var(--card-bg)", borderColor: "var(--t-border-card)" }}
          >
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-4 w-full mb-1" muted />
            <Skeleton className="h-4 w-11/12 mb-1" muted />
            <Skeleton className="h-4 w-5/6" muted />
          </div>
        ))}
      </div>
    </div>
  );
}
