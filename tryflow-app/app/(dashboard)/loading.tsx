export default function DashboardLoading() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 " />
        <div className="h-4 w-80 bg-gray-100 " />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white  border border-gray-100 p-5 h-28 space-y-3">
            <div className="h-10 w-10 bg-gray-100 " />
            <div className="h-4 w-24 bg-gray-100 " />
            <div className="h-7 w-16 bg-gray-200 " />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white  border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-4 w-40 bg-gray-200 " />
        </div>
        <div className="divide-y divide-gray-50">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-7 h-7  bg-gray-100 shrink-0" />
              <div className="h-4 flex-1 bg-gray-100 " />
              <div className="h-4 w-16 bg-gray-100 rounded-full" />
              <div className="h-4 w-12 bg-gray-100 " />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
