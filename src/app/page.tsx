import { getDb } from '@/lib/db';
import DashboardClient from './DashboardClient';
import type { Summary, ChartPoint, Order } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const sql = getDb();
  const days = 7;

  const [
    [totalRev], [todayRev], [totalOrd], [todayOrd], [totalItems], [pending],
    chartRows, orderRows,
  ] = await Promise.all([
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
    sql`
      SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object('id',oi.id,'item_id',oi.item_id,'item_name',oi.item_name,
              'quantity',oi.quantity,'unit_price',oi.unit_price,'subtotal',oi.subtotal)
            ORDER BY oi.created_at ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC LIMIT 8
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
    <DashboardClient
      initialSummary={summary}
      initialChart={chart}
      initialOrders={orderRows as unknown as Order[]}
    />
  );
}
