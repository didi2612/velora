'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Zap, CheckCircle, Maximize2, Minimize2, Loader2 } from 'lucide-react';
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

  // Refs so the poll closure always reads the latest values without re-creating the interval
  const statusRef   = useRef<PageStatus>('idle');
  const paidTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateStatus(s: PageStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  /* clock */
  useEffect(() => {
    const tick = () => setTime(format(new Date(), 'h:mm a'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* fullscreen */
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

  /* polling every 2 s */
  useEffect(() => {
    async function poll() {
      let data: { status: string; order?: DisplayOrder } = { status: 'idle' };
      try {
        const res = await fetch('/api/customer/status');
        if (res.ok) data = await res.json();
      } catch { return; } // network error — skip this tick

      const current = statusRef.current;

      if (data.status === 'paid' && data.order) {
        // Don't restart the paid timer if it's already showing
        if (current !== 'paid') {
          if (paidTimer.current) clearTimeout(paidTimer.current);
          updateStatus('paid');
          setOrder(data.order);
          paidTimer.current = setTimeout(() => {
            updateStatus('idle');
            setOrder(null);
          }, 5000);
        }

      } else if (data.status === 'pending' && data.order) {
        if (current !== 'paid') {          // don't override the paid countdown
          updateStatus('pending');
          setOrder(data.order);
        }

      } else if (data.status === 'ordering' && data.order) {
        if (current !== 'paid') {
          updateStatus('ordering');
          setOrder(data.order);
        }

      } else if (data.status === 'idle') {
        if (current !== 'paid') {
          updateStatus('idle');
          setOrder(null);
        }
      }
    }

    poll(); // immediate first call
    const id = setInterval(poll, 2000);
    return () => {
      clearInterval(id);
      if (paidTimer.current) clearTimeout(paidTimer.current);
    };
  }, []); // runs once — statusRef keeps it fresh

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden font-sans">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(99,102,241,0.09),transparent)]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-300 tracking-wide">Velora</span>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        {status === 'idle'                              && <IdleScreen />}
        {(status === 'ordering' || status === 'pending') && order && (
          <ActiveOrderScreen order={order} showQr={status === 'pending'} />
        )}
        {status === 'paid' && order && <PaidScreen order={order} />}
      </div>
    </div>
  );
}

/* ─── Idle ────────────────────────────────────────────────────────────── */
function IdleScreen() {
  return (
    <div className="flex flex-col items-center text-center max-w-xs">
      <div className="w-28 h-28 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-8">
        <Zap size={52} className="text-indigo-500/50" />
      </div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-3">Welcome</h1>
      <p className="text-slate-500 text-base mb-10">Your order will appear here</p>
      <div className="flex items-center gap-2.5 px-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="text-sm text-slate-400">Ready to serve you</span>
      </div>
    </div>
  );
}

/* ─── Active order: ordering + pending/QR ────────────────────────────── */
function ActiveOrderScreen({ order, showQr }: { order: DisplayOrder; showQr: boolean }) {
  const total = order.items.reduce((s, i) => s + Number(i.subtotal), 0);

  return (
    <div className="w-full max-w-sm flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-0.5">Order</p>
          <p className="text-lg font-bold text-white">{order.order_number}</p>
        </div>
        {showQr ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-medium text-indigo-400">Payment ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Loader2 size={12} className="text-amber-400 animate-spin" />
            <span className="text-xs font-medium text-amber-400">Preparing</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl overflow-hidden">
        {order.items.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-500 text-sm">
            Items will appear as they&apos;re added…
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50 max-h-56 overflow-y-auto">
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
        )}
        {/* Total */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-700/30 border-t border-slate-700/60">
          <span className="text-sm font-semibold text-slate-400">Total</span>
          <span className="text-2xl font-black text-white">RM {total.toFixed(2)}</span>
        </div>
      </div>

      {/* QR — only when cashier has clicked Pay and bill is created */}
      {showQr && order.bill_url ? (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-black/50">
            <QRCodeSVG value={order.bill_url} size={200} level="M" includeMargin={false} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-white">Scan to pay</p>
            <p className="text-xs text-slate-500 mt-0.5">DuitNow · FPX · Online Banking</p>
          </div>
        </div>
      ) : !showQr && order.items.length > 0 ? (
        <p className="text-center text-xs text-slate-600">
          Please wait while your order is being prepared
        </p>
      ) : null}
    </div>
  );
}

/* ─── Paid ────────────────────────────────────────────────────────────── */
function PaidScreen({ order }: { order: DisplayOrder }) {
  return (
    <div className="flex flex-col items-center text-center max-w-xs">
      <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
        <CheckCircle size={56} className="text-emerald-400" />
      </div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">Thank You!</h1>
      <p className="text-slate-400 text-base mb-5">Payment Successful</p>
      <p className="text-4xl font-black text-emerald-400 mb-3">
        RM {Number(order.total).toFixed(2)}
      </p>
      <p className="text-sm text-slate-600">{order.order_number}</p>
    </div>
  );
}
