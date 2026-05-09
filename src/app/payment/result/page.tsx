'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Zap } from 'lucide-react';

const REDIRECT_TO  = 'https://azpgroup.org';
const REDIRECT_SEC = 5;

/* ─── inner component reads searchParams ─────────────────────────── */
function ResultContent() {
  const params  = useSearchParams();
  const paid    = params.get('billplz[paid]') === 'true';
  const billId  = params.get('billplz[id]') ?? '';
  const [count, setCount] = useState(REDIRECT_SEC);

  useEffect(() => {
    const t = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(t);
          window.location.href = REDIRECT_TO;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center text-white px-6 text-center">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            paid
              ? 'bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(16,185,129,0.07),transparent)]'
              : 'bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(239,68,68,0.07),transparent)]'
          }`}
        />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-16 opacity-30">
        <div className="w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold tracking-widest uppercase">Velora</span>
      </div>

      {/* Icon with rings */}
      <div className="relative mb-10">
        <div
          className={`absolute inset-0 -m-12 rounded-full border animate-ping [animation-duration:2s] ${
            paid ? 'border-emerald-500/10' : 'border-red-500/10'
          }`}
        />
        <div
          className={`absolute inset-0 -m-6 rounded-full border ${
            paid ? 'border-emerald-500/15' : 'border-red-500/15'
          }`}
        />
        <div
          className={`w-28 h-28 rounded-full flex items-center justify-center ${
            paid ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}
        >
          {paid
            ? <CheckCircle size={60} className="text-emerald-400" strokeWidth={1.5} />
            : <XCircle    size={60} className="text-red-400"     strokeWidth={1.5} />
          }
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3">
        {paid ? 'Payment Successful!' : 'Payment Failed'}
      </h1>

      <p className="text-white/30 text-base font-light mb-10 max-w-sm">
        {paid
          ? 'Your payment has been received. Thank you!'
          : 'Something went wrong with your payment. Please try again.'}
      </p>

      {/* Bill ID */}
      {billId && (
        <p className="text-xs text-white/10 tracking-widest uppercase mb-10">
          Ref: {billId}
        </p>
      )}

      {/* Countdown */}
      <div className="flex flex-col items-center gap-3">
        {/* Progress ring */}
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke={paid ? 'rgb(52,211,153)' : 'rgb(248,113,113)'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - count / REDIRECT_SEC)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white/50">
            {count}
          </span>
        </div>
        <p className="text-xs text-white/20 tracking-wide">
          Redirecting to azpgroup.org…
        </p>
      </div>

      {/* Manual link */}
      <a
        href={REDIRECT_TO}
        className="mt-10 text-xs text-white/15 hover:text-white/40 transition-colors underline underline-offset-4"
      >
        Click here if not redirected
      </a>
    </div>
  );
}

/* ─── page with Suspense (required by Next.js for useSearchParams) ── */
export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
