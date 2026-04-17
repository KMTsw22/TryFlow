import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoryDetailLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <div
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ borderColor: "var(--t-border)" }}
      >
        <Skeleton className="h-7 w-24" muted />
        <Skeleton className="h-8 w-28" muted />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back link */}
        <Skeleton className="h-3 w-28 mb-6" muted />

        {/* PageHeader */}
        <div className="mb-8 space-y-2">
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-20" muted />
          </div>
          <Skeleton className="h-4 w-[32rem] max-w-full" muted />
        </div>

        {/* Insight panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Chart block — span 2 */}
          <div
            className="md:col-span-2 border p-5"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--t-border-card)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-3 w-44" muted />
              <Skeleton className="h-3 w-20" muted />
            </div>
            <Skeleton className="h-[120px] w-full" muted />
            <div className="mt-4 flex items-center gap-4">
              <Skeleton className="h-3 w-24" muted />
              <Skeleton className="h-3 w-24" muted />
            </div>
          </div>

          {/* Keywords block */}
          <div
            className="border p-5"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--t-border-card)",
            }}
          >
            <Skeleton className="h-3 w-28 mb-4" muted />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" muted />
                  <Skeleton className="h-3 w-6" muted />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ideas section label */}
        <Skeleton className="h-4 w-24 mb-4" />

        {/* Ideas grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border p-5"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--t-border-card)",
                minHeight: 200,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <Skeleton className="h-4 w-16" muted />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full mb-1" muted />
              <Skeleton className="h-3 w-5/6 mb-4" muted />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16" muted />
                <Skeleton className="h-3 w-14" muted />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
