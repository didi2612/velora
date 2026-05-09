function Sk({ className }: { className?: string }) {
  return <div className={`bg-slate-700/40 rounded animate-pulse ${className ?? ''}`} />;
}

export default function ItemsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <Sk className="h-10 flex-1 rounded-lg" />
        <Sk className="h-10 w-28 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <Sk key={i} className="h-7 w-16 rounded-full" />)}
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-slate-700 bg-slate-800/50">
          <div className="flex px-5 py-3 gap-4">
            {[40, 24, 16, 16, 48, 20].map((w, i) => (
              <Sk key={i} className={`h-3 w-${w} flex-shrink-0`} />
            ))}
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center px-5 py-3.5 gap-4 border-b border-slate-700/40">
            <Sk className="h-4 w-32" />
            <Sk className="h-5 w-16 rounded-full" />
            <Sk className="h-4 w-14 ml-auto" />
            <Sk className="h-4 w-8" />
            <Sk className="h-3 w-40" />
            <Sk className="h-6 w-14 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
