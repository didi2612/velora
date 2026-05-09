function Sk({ className }: { className?: string }) {
  return <div className={`bg-slate-700/40 rounded animate-pulse ${className ?? ''}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Sk className="h-3 w-24 mb-2" />
                <Sk className="h-8 w-28" />
              </div>
              <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <Sk className="h-4 w-32" />
            <Sk className="h-7 w-28 rounded-lg" />
          </div>
          <Sk className="h-52 w-full rounded-lg" />
        </div>
        <div className="card p-5">
          <Sk className="h-4 w-24 mb-5" />
          <Sk className="h-52 w-full rounded-lg" />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <Sk className="h-4 w-28" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40">
            <div>
              <Sk className="h-4 w-36 mb-1.5" />
              <Sk className="h-3 w-28" />
            </div>
            <div className="flex items-center gap-3">
              <Sk className="h-4 w-16" />
              <Sk className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
