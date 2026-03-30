export default function HomeLoading() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-8 animate-pulse">
      {/* banner skeleton */}
      <div className="rounded-2xl bg-purple-200 h-44" />

      {/* grid header */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-36 bg-gray-200 rounded-lg" />
        <div className="h-4 w-20 bg-gray-100 rounded-lg" />
      </div>

      {/* project cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
              <div className="h-4 w-10 bg-gray-100 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-4/5 bg-gray-100 rounded" />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-14 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
