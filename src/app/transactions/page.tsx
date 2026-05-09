'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { DollarSign, TrendingUp, Receipt, Calendar, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { transactionsApi } from '@/lib/api';
import type { Transaction, Summary, ChartPoint } from '@/types';
import Modal from '@/components/Modal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-indigo-400">RM {Number(payload[0]?.value ?? 0).toFixed(2)}</p>
      {payload[1] && (
        <p className="text-xs text-slate-400">{payload[1].value} orders</p>
      )}
    </div>
  );
};

const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [chart, setChart]               = useState<ChartPoint[]>([]);
  const [period, setPeriod]             = useState(7);
  const [loading, setLoading]           = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txns, sum, ch] = await Promise.all([
        transactionsApi.getAll(),
        transactionsApi.getSummary(),
        transactionsApi.getChart(period),
      ]);
      setTransactions(txns);
      setSummary(sum);
      setChart(ch);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(txn: Transaction) {
    try {
      await transactionsApi.delete(txn.id);
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      toast.success('Transaction deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setConfirmDelete(null);
    }
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: `RM ${summary?.totalRevenue.toFixed(2) ?? '0.00'}`,
      icon: DollarSign,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: "Today's Revenue",
      value: `RM ${summary?.todayRevenue.toFixed(2) ?? '0.00'}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Transactions',
      value: transactions.length,
      icon: Receipt,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: "Today's Transactions",
      value: transactions.filter(t => t.created_at.startsWith(new Date().toISOString().slice(0, 10))).length,
      icon: Calendar,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
  ];

  const avgRevenue = chart.length
    ? chart.reduce((sum, p) => sum + p.revenue, 0) / (chart.filter(p => p.revenue > 0).length || 1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm font-semibold text-white">Revenue Trend</h2>
            {!loading && avgRevenue > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                Avg RM {avgRevenue.toFixed(2)} / active day
              </p>
            )}
          </div>
          <div className="flex gap-1 bg-slate-700/50 rounded-lg p-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  period === p.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={d => format(parseISO(d), period <= 7 ? 'EEE' : 'MMM d')}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `RM${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#6366F1' }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#10B981"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="flex gap-4 mt-3 justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-4 h-0.5 bg-indigo-500 inline-block rounded" />
            Revenue
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded border-dashed border-t-2 border-emerald-500" />
            Orders
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">
            Transaction History
            <span className="ml-2 text-xs font-normal text-slate-500">({transactions.length} total)</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Receipt size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs text-slate-600 mt-1">Complete an order to create a transaction</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Order</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {transactions.map((txn, idx) => (
                  <tr key={txn.id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500">{idx + 1}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white">{txn.order_number}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-emerald-400">RM {Number(txn.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm text-slate-400">
                        {format(parseISO(txn.created_at), 'MMM d, yyyy · h:mm a')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setConfirmDelete(txn)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete Transaction"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-slate-300 mb-1">
          Delete transaction <strong className="text-white">{confirmDelete?.order_number}</strong>?
        </p>
        <p className="text-xs text-slate-500 mb-5">
          This only removes the record — the order itself is not affected.
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
