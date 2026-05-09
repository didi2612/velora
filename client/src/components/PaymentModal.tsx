import { useEffect, useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { paymentApi, type BillPlzBill } from '../lib/api';
import type { Order } from '../types';

interface Props {
  order: Order | null;
  onPaid: (order: Order) => void;
  onClose: () => void;
}

type Stage = 'name' | 'creating' | 'qr' | 'paid' | 'error';

const POLL_INTERVAL_MS = 3000;

export default function PaymentModal({ order, onPaid, onClose }: Props) {
  const [stage, setStage]         = useState<Stage>('name');
  const [bill, setBill]           = useState<BillPlzBill | null>(null);
  const [errMsg, setErrMsg]       = useState('');
  const [name, setName]           = useState('Customer');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const createBill = useCallback(async () => {
    if (!order) return;
    setStage('creating');
    setErrMsg('');
    setBill(null);
    try {
      const b = await paymentApi.createBill(order.order_number, order.total, name);
      setBill(b);
      setStage('qr');
    } catch (err: any) {
      setErrMsg(err.message);
      setStage('error');
    }
  }, [order, name]);

  // Poll BillPlz until paid
  useEffect(() => {
    if (stage !== 'qr' || !bill) return;
    pollRef.current = setInterval(async () => {
      try {
        const updated = await paymentApi.getBill(bill.id);
        if (updated.paid) {
          stopPoll();
          setStage('paid');
          setBill(updated);
          setTimeout(() => order && onPaid(order), 1800);
        }
      } catch { /* ignore polling errors */ }
    }, POLL_INTERVAL_MS);
    return stopPoll;
  }, [stage, bill, order, onPaid, stopPoll]);

  // Reset when order changes
  useEffect(() => {
    if (!order) return;
    setName('Customer');
    setStage('name');
    setBill(null);
    stopPoll();
  }, [order, stopPoll]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={stage === 'paid' ? undefined : onClose}
      />

      <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-slate-700">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">BillPlz Payment</p>
          <p className="text-sm font-semibold text-slate-300">{order.order_number}</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">
            RM {Number(order.total).toFixed(2)}
          </p>
        </div>

        <div className="px-6 py-6">

          {/* ── Name entry ── */}
          {stage === 'name' && (
            <div className="space-y-4">
              <div>
                <label className="label">Customer Name</label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Customer"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && createBill()}
                />
                <p className="mt-1 text-xs text-slate-500">Shown on the BillPlz receipt</p>
              </div>
              <button className="btn-primary w-full" onClick={createBill}>
                Generate Payment QR
              </button>
              <button className="btn-secondary w-full" onClick={onClose}>
                Cancel
              </button>
            </div>
          )}

          {/* ── Creating ── */}
          {stage === 'creating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={36} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400">Generating payment link…</p>
            </div>
          )}

          {/* ── QR shown ── */}
          {stage === 'qr' && bill && (
            <div className="flex flex-col items-center gap-4">

              {/* How-to badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Smartphone size={13} className="text-blue-400" />
                <span className="text-xs font-medium text-blue-300">Scan with phone camera</span>
              </div>

              {/* QR — BillPlz payment link */}
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <QRCodeSVG
                  value={bill.url}
                  size={210}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Payment methods */}
              <div className="text-center space-y-0.5">
                <p className="text-sm font-semibold text-white">Opens BillPlz payment page</p>
                <p className="text-xs text-slate-400">Pay via DuitNow · FPX · Online Banking</p>
              </div>

              {/* Polling indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Waiting for payment confirmation…
              </div>

              {/* Direct link fallback */}
              <a
                href={bill.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium transition-colors"
              >
                <ExternalLink size={14} />
                Open payment page directly
              </a>

              <div className="w-full flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  onClick={() => { stopPoll(); setStage('name'); }}
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
                <button className="flex-1 text-xs py-2 rounded-lg btn-danger" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {stage === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <XCircle size={40} className="text-red-400" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">Failed to create bill</p>
                <p className="text-xs text-red-400">{errMsg}</p>
              </div>
              <button className="btn-primary w-full" onClick={() => setStage('name')}>
                Try Again
              </button>
              <button className="btn-secondary w-full" onClick={onClose}>Close</button>
            </div>
          )}

          {/* ── Paid ── */}
          {stage === 'paid' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={36} className="text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">Payment Received!</p>
                <p className="text-sm text-slate-400 mt-1">
                  RM {Number(order.total).toFixed(2)} — {bill?.name}
                </p>
              </div>
              <p className="text-xs text-slate-500">Completing order…</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
