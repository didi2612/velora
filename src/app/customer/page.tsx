import Link from 'next/link';
import { Zap, AlertTriangle } from 'lucide-react';

export default function CustomerIndexPage() {
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center text-white px-6 text-center">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(99,102,241,0.07),transparent)]" />

      <div className="relative flex flex-col items-center gap-6 max-w-sm">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
          <Zap size={28} className="text-white" />
        </div>

        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle size={22} className="text-amber-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid URL</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            This page is not valid. Each vendor has their own customer display URL in the format:
          </p>
          <p className="mt-3 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-indigo-300 text-sm font-mono">
            /customer/<span className="text-white">your-vendor-id</span>
          </p>
          <p className="mt-3 text-slate-500 text-xs">
            Log in to your Velora account and click <strong className="text-slate-400">Customer Screen</strong> in the header to get your link.
          </p>
        </div>

        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
