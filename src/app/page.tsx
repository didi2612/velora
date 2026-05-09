'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { transactionsApi, ordersApi } from '@/lib/api';
import type { Summary, ChartPoint, Order } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending:   '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-indigo-400">RM {Number(payload[0].value).toFixed(2)}</p>
      {payload[1] && <p className="text-xs text-slate-400">{payload[1].value} orders</p>}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart]     = useState<ChartPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, orders] = await Promise.all([
        transactionsApi.getSummary(),
        transactionsApi.getChart(period),
        ordersApi.getAll(),
      ]);
      setSummary(s);
      setChart(c);
      setRecentOrders(orders.slice(0, 8));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const pieData = recentOrders.reduce<{ name: string; value: number }[]>((acc, o) => {
    const found = acc.find(a => a.name === o.status);
    if (found) found.value++;
    else acc.push({ name: o.status, value: 1 });
    return acc;
  }, []);

  const statCards = [
    {
      label: "Today's Revenue",
      value: `RM ${summary?.todayRevenue.toFixed(2) ?? '0.00'}`,
      icon: DollarSign,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: "Today's Orders",
      value: summary?.todayOrders ?? 0,
      icon: ShoppingCart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Total Revenue',
      value: `RM ${summary?.totalRevenue.toFixed(2) ?? '0.00'}`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Pending Orders',
      value: summary?.pendingOrders ?? 0,
      icon: Clock,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`card p-5 border ${border}`}>
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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-white">Revenue Overview</h2>
            <div className="flex gap-1 bg-slate-700/50 rounded-lg p-1">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setPeriod(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === d
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={d => format(parseISO(d), 'MMM d')}
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155' }} />
              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status pie */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-5">Order Status</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#6366F1'} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span className="text-xs capitalize text-slate-300">{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          <Link
            href="/orders"
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No orders yet</div>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-700/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{order.order_number}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                    {format(parseISO(order.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">RM {Number(order.total).toFixed(2)}</span>
                  <span className={`badge-${order.status}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
