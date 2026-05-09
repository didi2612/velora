function Sk({ className }: { className?: string }) {
  return <div className={`bg-slate-700/40 rounded animate-pulse ${className ?? ''}`} />;
}

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 flex items-start justify-between">
            <div>
              <Sk className="h-3 w-24 mb-2" />
              <Sk className="h-8 w-28" />
            </div>
            <Sk className="w-10 h-10 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <Sk className="h-4 w-28" />
          <Sk className="h-7 w-40 rounded-lg" />
        </div>
        <Sk className="h-64 w-full rounded-lg" />
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <Sk className="h-4 w-36" />
        </div>
        <div className="border-b border-slate-700 bg-slate-800/50 flex px-5 py-3 gap-6">
          {[8, 32, 20, 32, 8].map((w, i) => <Sk key={i} className={`h-3 w-${w}`} />)}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center px-5 py-3.5 gap-6 border-b border-slate-700/40">
            <Sk className="h-3 w-4" />
            <Sk className="h-4 w-32" />
            <Sk className="h-4 w-16 ml-auto" />
            <Sk className="h-3 w-36" />
            <Sk className="h-6 w-6 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
