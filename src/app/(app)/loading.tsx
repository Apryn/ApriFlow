export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-32 rounded-lg bg-gray-200" />
        <div className="h-4 w-48 rounded-lg bg-gray-200" />
      </div>

      {/* Quick Input Bar Skeleton */}
      <div className="flex gap-2">
        <div className="h-11 flex-1 rounded-2xl bg-gray-200" />
        <div className="h-11 w-11 rounded-2xl bg-gray-200" />
      </div>

      {/* Summary Cards Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100/50 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-7 w-7 rounded-lg bg-gray-100" />
            </div>
            <div className="h-6 w-24 rounded bg-gray-200 mt-2" />
          </div>
        ))}
      </div>

      {/* List Card Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4 shadow-sm">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
