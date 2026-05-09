'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Zap, CheckCircle, Maximize2, Minimize2, Wifi } from 'lucide-react';
import { format } from 'date-fns';

/* ── Types ─────────────────────────────────────────────────────────── */
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
  bill_url: string;
  items: DisplayItem[];
}

type PageStatus = 'idle' | 'pending' | 'paid';

/* ── Root page ─────────────────────────────────────────────────────── */
export default function CustomerPage() {
  const [status, setStatus]         = useState<PageStatus>('idle');
  const [order, setOrder]           = useState<DisplayOrder | null>(null);
  const [time, setTime]             = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const paidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* clock */
  useEffect(() => {
    const tick = () => setTime(format(new Date(), 'h:mm a'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* fullscreen tracking */
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

  /* polling */
  useEffect(() => {
    async function poll() {
      try {
        const res  = await fetch('/api/customer/status');
        const data = await res.json() as { status: string; order?: DisplayOrder };

        if (data.status === 'pending' && data.order) {
          if (paidTimer.current) { clearTimeout(paidTimer.current); paidTimer.current = null; }
          setStatus('pending');
          setOrder(data.order);

        } else if (data.status === 'paid' && data.order) {
          setStatus('paid');
          setOrder(data.order);
          if (paidTimer.current) clearTimeout(paidTimer.current);
          paidTimer.current = setTimeout(() => {
            setStatus('idle');
            setOrder(null);
          }, 5000);

        } else {
          // idle — but don't interrupt a "paid" countdown
          setStatus(prev => prev === 'paid' ? 'paid' : 'idle');
          if (status !== 'paid') setOrder(null);
        }
      } catch { /* ignore */ }
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => { clearInterval(id); if (paidTimer.current) clearTimeout(paidTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow shadow-indigo-900/60">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-400 tracking-wide">Velora</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Wifi size={12} className="text-emerald-600" />
            <span className="hidden sm:inline">live</span>
          </div>
          <span className="text-sm tabular-nums text-slate-500">{time}</span>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-4">
        {status === 'idle'    && <IdleScreen />}
        {status === 'pending' && order && <PendingScreen order={order} />}
        {status === 'paid'    && order && <PaidScreen order={order} />}
      </div>
    </div>
  );
}

/* ── Idle ──────────────────────────────────────────────────────────── */
function IdleScreen() {
  return (
    <div className="flex flex-col items-center text-center max-w-sm">
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
          <Zap size={56} className="text-indigo-500/60" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600/30 rounded-full blur-sm" />
      </div>

      <h1 className="text-5xl font-black text-white tracking-tight mb-3">Welcome</h1>
      <p className="text-slate-500 text-lg mb-12">Your order will appear here shortly</p>

      <div className="flex items-center gap-3 px-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="text-sm text-slate-400">Ready to accept payment</span>
      </div>
    </div>
  );
}

/* ── Pending payment ───────────────────────────────────────────────── */
function PendingScreen({ order }: { order: DisplayOrder }) {
  return (
    <div className="w-full max-w-md flex flex-col items-center gap-5">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Your Order</p>
        <p className="text-lg font-bold text-white">{order.order_number}</p>
      </div>

      {/* Items list */}
      <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden">
        <div className="max-h-52 overflow-y-auto divide-y divide-slate-700/50">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {item.quantity}
                </span>
                <span className="text-sm text-white truncate">{item.item_name}</span>
              </div>
              <span className="text-sm font-medium text-slate-300 ml-3 flex-shrink-0">
                RM {Number(item.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Total row */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-700/30 border-t border-slate-700/60">
          <span className="text-sm font-semibold text-slate-300">Total</span>
          <span className="text-3xl font-black text-white">
            RM {Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* QR */}
      <div className="flex flex-col items-center gap-3">
        <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-black/40">
          <QRCodeSVG value={order.bill_url} size={196} level="M" includeMargin={false} />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-white">Scan to pay</p>
          <p className="text-xs text-slate-500 mt-0.5">DuitNow · FPX · Online Banking</p>
        </div>
      </div>
    </div>
  );
}

/* ── Paid ──────────────────────────────────────────────────────────── */
function PaidScreen({ order }: { order: DisplayOrder }) {
  return (
    <div className="flex flex-col items-center text-center max-w-sm">
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle size={60} className="text-emerald-400" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-emerald-500/20 rounded-full blur-md" />
      </div>

      <h1 className="text-5xl font-black text-white tracking-tight mb-3">Thank You!</h1>
      <p className="text-slate-400 text-lg mb-6">Payment Successful</p>
      <p className="text-4xl font-black text-emerald-400 mb-8">
        RM {Number(order.total).toFixed(2)}
      </p>
      <p className="text-sm text-slate-600">{order.order_number}</p>
    </div>
  );
}
