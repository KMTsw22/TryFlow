export default function LandingLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* top banner skeleton */}
      <div className="h-8 bg-teal-700/80 animate-pulse" />

      {/* hero skeleton */}
      <div className="h-52 bg-gray-200 animate-pulse" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* pricing cards */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>

        {/* feature votes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 animate-pulse">
          <div className="h-4 w-36 bg-gray-200 rounded-lg" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
              <div className="w-16 h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>

        {/* comments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 animate-pulse">
          <div className="h-4 w-28 bg-gray-200 rounded-lg" />
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
