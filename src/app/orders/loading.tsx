function Sk({ className }: { className?: string }) {
  return <div className={`bg-slate-700/40 rounded animate-pulse ${className ?? ''}`} />;
}

export default function OrdersLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 space-y-4">
        <div className="flex gap-3">
          <Sk className="h-10 flex-1 rounded-lg" />
          <Sk className="h-10 w-32 rounded-lg" />
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <Sk key={i} className="h-7 w-16 rounded-full" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <Sk className="h-5 w-14 rounded-full" />
              <Sk className="h-4 w-24" />
              <Sk className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="w-full lg:w-80 xl:w-96 space-y-4">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <Sk className="h-4 w-28" />
            <Sk className="h-5 w-16 rounded-full" />
          </div>
          <div className="py-10 flex items-center justify-center">
            <Sk className="h-24 w-24 rounded-full" />
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-700">
            <Sk className="h-4 w-24" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-2 border-b border-slate-700/40">
              <div className="flex-1">
                <Sk className="h-3 w-32 mb-1.5" />
                <Sk className="h-3 w-24" />
              </div>
              <Sk className="h-5 w-16 rounded-full" />
              <Sk className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
