'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Zap, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
import { format } from 'date-fns';

/* ─── types ──────────────────────────────────────────────────────────── */
interface DisplayItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
interface DisplayOrder {
  id: number;
  order_number: string;
  total: number;
  bill_url?: string;
  items: DisplayItem[];
}
type PageStatus = 'idle' | 'ordering' | 'pending' | 'paid';

/* ─── page ───────────────────────────────────────────────────────────── */
export default function CustomerPage() {
  const [status, setStatus]             = useState<PageStatus>('idle');
  const [order, setOrder]               = useState<DisplayOrder | null>(null);
  const [time, setTime]                 = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const statusRef = useRef<PageStatus>('idle');
  const paidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateStatus(s: PageStatus) { statusRef.current = s; setStatus(s); }

  useEffect(() => {
    const tick = () => setTime(format(new Date(), 'h:mm a'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* ignore */ }
  }

  useEffect(() => {
    async function poll() {
      let data: { status: string; order?: DisplayOrder } = { status: 'idle' };
      try {
        const res = await fetch('/api/customer/status');
        if (res.ok) data = await res.json();
      } catch { return; }

      const cur = statusRef.current;

      if (data.status === 'paid' && data.order) {
        if (cur !== 'paid') {
          if (paidTimer.current) clearTimeout(paidTimer.current);
          updateStatus('paid');
          setOrder(data.order);
          paidTimer.current = setTimeout(() => { updateStatus('idle'); setOrder(null); }, 5500);
        }
      } else if (data.status === 'pending' && data.order) {
        if (cur !== 'paid') { updateStatus('pending'); setOrder(data.order); }
      } else if (data.status === 'ordering' && data.order) {
        if (cur !== 'paid') { updateStatus('ordering'); setOrder(data.order); }
      } else if (data.status === 'idle') {
        if (cur !== 'paid') { updateStatus('idle'); setOrder(null); }
      }
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => { clearInterval(id); if (paidTimer.current) clearTimeout(paidTimer.current); };
  }, []);

  const isActive = status === 'ordering' || status === 'pending';

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col overflow-hidden select-none">

      {/* ── decorative background blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-800/[0.05] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-800/[0.05] rounded-full blur-3xl" />
        {status === 'paid' && (
          <div className="absolute inset-0 bg-emerald-500/[0.04] transition-opacity duration-1000" />
        )}
      </div>

      {/* ── top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-7 py-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white/50 tracking-widest uppercase">Velora</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm tabular-nums text-white/25 font-light tracking-wide">{time}</span>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ── main content ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-4">

        {status === 'idle' && <IdleScreen time={time} />}

        {isActive && order && (
          <ActiveOrderScreen order={order} showQr={status === 'pending'} />
        )}

        {status === 'paid' && order && <PaidScreen order={order} />}
      </div>

      {/* ── bottom bar ── */}
      <div className="relative z-10 flex items-center justify-center pb-5 flex-shrink-0">
        <p className="text-[11px] text-white/10 tracking-widest uppercase">
          Powered by Velora
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   IDLE
══════════════════════════════════════════════════════════════════════ */
function IdleScreen({ time }: { time: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Large clock */}
      <p className="text-7xl sm:text-8xl font-extralight tabular-nums text-white/30 tracking-wider mb-14">
        {time}
      </p>

      {/* Animated logo */}
      <div className="relative mb-10">
        {/* Outer slow pulse ring */}
        <div className="absolute inset-0 -m-10 rounded-full border border-indigo-500/10 animate-ping [animation-duration:3s]" />
        {/* Mid ring */}
        <div className="absolute inset-0 -m-5 rounded-full border border-indigo-500/15" />
        {/* Inner ring */}
        <div className="absolute inset-0 -m-2 rounded-full border border-indigo-500/20" />
        {/* Logo icon */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
          <Zap size={36} className="text-white" />
        </div>
      </div>

      {/* Brand */}
      <h1 className="text-5xl sm:text-6xl font-black tracking-[0.18em] text-white/90 mb-3">
        VELORA
      </h1>
      <p className="text-sm text-white/25 tracking-[0.25em] uppercase mb-14">
        Cashier System
      </p>

      {/* Status pill */}
      <div className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/[0.06] bg-white/[0.03]">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="text-sm text-white/40 font-medium">Ready to serve you</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ACTIVE ORDER (ordering + pending/QR)  —  split layout
══════════════════════════════════════════════════════════════════════ */
function ActiveOrderScreen({ order, showQr }: { order: DisplayOrder; showQr: boolean }) {
  const total = order.items.reduce((s, i) => s + Number(i.subtotal), 0);

  return (
    <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-5 lg:gap-8">

      {/* ── left: order summary card ── */}
      <div className="flex-1 flex flex-col bg-white/[0.03] border border-white/[0.07] rounded-3xl overflow-hidden backdrop-blur-sm">

        {/* Card header */}
        <div className="px-7 py-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.2em] mb-1">
                Your Order
              </p>
              <p className="text-lg font-bold text-white/80">{order.order_number}</p>
            </div>
            {showQr ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Payment Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Preparing
              </span>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {order.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <p className="text-sm">Items will appear here as they&apos;re added…</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-7 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {item.quantity}
                    </span>
                    <span className="text-base text-white/80 font-medium truncate">{item.item_name}</span>
                  </div>
                  <span className="text-base font-semibold text-white/60 ml-4 flex-shrink-0">
                    RM {Number(item.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total row */}
        <div className="flex items-center justify-between px-7 py-5 border-t border-white/[0.06] bg-white/[0.02]">
          <span className="text-sm font-semibold text-white/40 uppercase tracking-widest">Total</span>
          <span className="text-4xl font-black text-white">RM {total.toFixed(2)}</span>
        </div>
      </div>

      {/* ── right: QR or preparing ── */}
      <div className="lg:w-72 xl:w-80 flex flex-col items-center justify-center">

        {showQr && order.bill_url ? (
          /* Payment / QR panel */
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="text-center">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.2em] mb-2">
                Amount Due
              </p>
              <p className="text-5xl font-black text-white">RM {total.toFixed(2)}</p>
            </div>

            {/* QR code */}
            <div className="p-5 bg-white rounded-3xl shadow-2xl shadow-black/60">
              <QRCodeSVG value={order.bill_url} size={220} level="M" includeMargin={false} />
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-base font-semibold text-white/80">Scan to pay</p>
              <div className="flex items-center justify-center gap-2">
                {['DuitNow', 'FPX', 'Online Banking'].map(m => (
                  <span key={m} className="px-2.5 py-0.5 rounded-full border border-white/10 text-xs text-white/30">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

        ) : (
          /* Preparing panel */
          <div className="flex flex-col items-center gap-8 text-center">
            {/* Spinner */}
            <div className="relative w-28 h-28">
              <div className="absolute inset-0 rounded-full border-2 border-white/5" />
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-indigo-500/50 border-b-transparent border-l-transparent animate-spin [animation-duration:1.2s]" />
              <div className="absolute inset-4 rounded-full border border-indigo-500/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap size={32} className="text-indigo-400/60" />
              </div>
            </div>

            <div>
              <p className="text-xl font-bold text-white/70 mb-2">Order in progress</p>
              <p className="text-sm text-white/25">Items appear as they&apos;re added</p>
            </div>

            {/* Animated dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-500/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAID
══════════════════════════════════════════════════════════════════════ */
function PaidScreen({ order }: { order: DisplayOrder }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated checkmark with rings */}
      <div className="relative mb-10">
        <div className="absolute inset-0 -m-14 rounded-full border border-emerald-500/10 animate-ping [animation-duration:2s]" />
        <div className="absolute inset-0 -m-7 rounded-full border border-emerald-500/15" />
        <div className="absolute inset-0 -m-3 rounded-full border border-emerald-500/20" />
        <div className="relative w-28 h-28 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle size={64} className="text-emerald-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Text */}
      <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tight mb-3">
        Thank You!
      </h1>
      <p className="text-lg text-white/30 mb-8 font-light tracking-wide">
        Payment Successful
      </p>

      {/* Amount */}
      <div className="px-10 py-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 mb-8">
        <p className="text-5xl font-black text-emerald-400">
          RM {Number(order.total).toFixed(2)}
        </p>
      </div>

      <p className="text-sm text-white/15 tracking-widest uppercase">{order.order_number}</p>
    </div>
  );
}
