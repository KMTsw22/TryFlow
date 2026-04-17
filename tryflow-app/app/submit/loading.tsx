import { Skeleton } from "@/components/ui/Skeleton";

export default function SubmitLoading() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <div
        className="flex items-center justify-between px-6 h-[60px] border-b"
        style={{ borderColor: "var(--t-border)" }}
      >
        <Skeleton className="h-7 w-24" muted />
        <Skeleton className="h-4 w-44" muted />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" muted />
          </div>

          {/* Progress segmented bar */}
          <div
            className="flex border overflow-hidden mb-6"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--t-border-card)",
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 px-4 py-2.5 flex items-center gap-2"
                style={{
                  borderRight: i < 2 ? "1px solid var(--t-border-subtle)" : undefined,
                }}
              >
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-3 w-20" muted />
              </div>
            ))}
          </div>

          {/* Card */}
          <div
            className="border p-7"
            style={{
              background: "var(--surface-1, var(--card-bg))",
              borderColor: "var(--t-border-card)",
            }}
          >
            <Skeleton className="h-5 w-64 mb-2" />
            <Skeleton className="h-4 w-72 mb-6" muted />

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" muted />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-7">
              <Skeleton className="h-4 w-12" muted />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
