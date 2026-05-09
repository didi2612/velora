import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    let totalRev, todayRev, totalOrders, todayOrders, totalItems, pendingOrders;

    if (session.role === 'admin') {
      [totalRev, todayRev, totalOrders, todayOrders, totalItems, pendingOrders] = await Promise.all([
        sql`SELECT COALESCE(SUM(amount), 0) AS val FROM transactions`,
        sql`SELECT COALESCE(SUM(amount), 0) AS val FROM transactions WHERE created_at::date = CURRENT_DATE`,
        sql`SELECT COUNT(*) AS val FROM orders`,
        sql`SELECT COUNT(*) AS val FROM orders WHERE created_at::date = CURRENT_DATE`,
        sql`SELECT COUNT(*) AS val FROM items`,
        sql`SELECT COUNT(*) AS val FROM orders WHERE status = 'pending'`,
      ]);
    } else {
      [totalRev, todayRev, totalOrders, todayOrders, totalItems, pendingOrders] = await Promise.all([
        sql`SELECT COALESCE(SUM(amount), 0) AS val FROM transactions WHERE order_id IN (SELECT id FROM orders WHERE vendor_id = ${session.id})`,
        sql`SELECT COALESCE(SUM(amount), 0) AS val FROM transactions WHERE created_at::date = CURRENT_DATE AND order_id IN (SELECT id FROM orders WHERE vendor_id = ${session.id})`,
        sql`SELECT COUNT(*) AS val FROM orders WHERE vendor_id = ${session.id}`,
        sql`SELECT COUNT(*) AS val FROM orders WHERE created_at::date = CURRENT_DATE AND vendor_id = ${session.id}`,
        sql`SELECT COUNT(*) AS val FROM items WHERE vendor_id = ${session.id}`,
        sql`SELECT COUNT(*) AS val FROM orders WHERE status = 'pending' AND vendor_id = ${session.id}`,
      ]);
    }

    return NextResponse.json({
      totalRevenue:  parseFloat(totalRev[0].val),
      todayRevenue:  parseFloat(todayRev[0].val),
      totalOrders:   parseInt(totalOrders[0].val),
      todayOrders:   parseInt(todayOrders[0].val),
      totalItems:    parseInt(totalItems[0].val),
      pendingOrders: parseInt(pendingOrders[0].val),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
