import { getDb } from '@/lib/db';
import TransactionsClient from './TransactionsClient';
import type { Transaction, Summary, ChartPoint } from '@/types';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const sql = getDb();
  const days = 7;

  const [txns, [totalRev], [todayRev], [totalOrd], [todayOrd], [totalItems], [pending], chartRows] =
    await Promise.all([
      sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200`,
      sql`SELECT COALESCE(SUM(amount),0) AS val FROM transactions`,
      sql`SELECT COALESCE(SUM(amount),0) AS val FROM transactions WHERE created_at::date = CURRENT_DATE`,
      sql`SELECT COUNT(*) AS val FROM orders`,
      sql`SELECT COUNT(*) AS val FROM orders WHERE created_at::date = CURRENT_DATE`,
      sql`SELECT COUNT(*) AS val FROM items`,
      sql`SELECT COUNT(*) AS val FROM orders WHERE status='pending'`,
      sql`
        SELECT DATE(created_at AT TIME ZONE 'UTC') AS date,
               COALESCE(SUM(amount),0) AS revenue, COUNT(*) AS orders
        FROM transactions
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
      `,
    ]);

  const summary: Summary = {
    totalRevenue:  parseFloat(String(totalRev.val)),
    todayRevenue:  parseFloat(String(todayRev.val)),
    totalOrders:   parseInt(String(totalOrd.val)),
    todayOrders:   parseInt(String(todayOrd.val)),
    totalItems:    parseInt(String(totalItems.val)),
    pendingOrders: parseInt(String(pending.val)),
  };

  const map: Record<string, { revenue: number; orders: number }> = {};
  for (const r of chartRows) {
    const key = new Date(r.date as string).toISOString().slice(0, 10);
    map[key] = { revenue: parseFloat(String(r.revenue)), orders: parseInt(String(r.orders)) };
  }
  const chart: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    chart.push({ date: key, revenue: map[key]?.revenue ?? 0, orders: map[key]?.orders ?? 0 });
  }

  return (
    <TransactionsClient
      initialTransactions={txns as unknown as Transaction[]}
      initialSummary={summary}
      initialChart={chart}
    />
  );
}
