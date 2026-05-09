import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const [totalRev, todayRev, totalOrders, todayOrders, totalItems, pendingOrders] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount), 0) AS val FROM transactions`,
      sql`SELECT COALESCE(SUM(amount), 0) AS val FROM transactions WHERE created_at::date = CURRENT_DATE`,
      sql`SELECT COUNT(*) AS val FROM orders`,
      sql`SELECT COUNT(*) AS val FROM orders WHERE created_at::date = CURRENT_DATE`,
      sql`SELECT COUNT(*) AS val FROM items`,
      sql`SELECT COUNT(*) AS val FROM orders WHERE status = 'pending'`,
    ]);
    return NextResponse.json({
      totalRevenue: parseFloat(totalRev[0].val),
      todayRevenue: parseFloat(todayRev[0].val),
      totalOrders: parseInt(totalOrders[0].val),
      todayOrders: parseInt(todayOrders[0].val),
      totalItems: parseInt(totalItems[0].val),
      pendingOrders: parseInt(pendingOrders[0].val),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
