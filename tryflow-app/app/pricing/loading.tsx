import { Skeleton } from "@/components/ui/Skeleton";

export default function PricingLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Navbar */}
      <div
        className="border-b px-6 h-[60px] flex items-center justify-between"
        style={{ borderColor: "var(--t-border)" }}
      >
        <Skeleton className="h-7 w-24" muted />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" muted />
          <Skeleton className="h-8 w-28" muted />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-4 w-40 mx-auto" muted />
          <Skeleton className="h-9 w-96 max-w-full mx-auto" />
          <Skeleton className="h-4 w-[32rem] max-w-full mx-auto" muted />
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border p-6 flex flex-col"
              style={{
                background: "var(--card-bg)",
                borderColor: "var(--t-border-card)",
                minHeight: 500,
              }}
            >
              {/* Plan name */}
              <Skeleton className="h-5 w-20 mb-3" />
              {/* Price */}
              <div className="flex items-end gap-2 mb-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-4 w-14 mb-1" muted />
              </div>
              {/* Description */}
              <Skeleton className="h-4 w-full mb-1.5" muted />
              <Skeleton className="h-4 w-5/6 mb-6" muted />

              {/* Features list */}
              <div className="space-y-2.5 mb-6 flex-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-start gap-2.5">
                    <Skeleton className="h-4 w-4 mt-0.5 shrink-0" muted />
                    <Skeleton className="h-4 flex-1" muted />
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <Skeleton className="h-4 w-4" muted />
          <Skeleton className="h-4 w-64" muted />
        </div>
      </div>
    </div>
  );
}
