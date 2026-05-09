import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.nextUrl.searchParams.get('days') ?? '7')));
    const sql = getDb();
    const rows = await sql`
      SELECT DATE(created_at AT TIME ZONE 'UTC') AS date, COALESCE(SUM(amount), 0) AS revenue, COUNT(*) AS orders
      FROM transactions
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY date ASC
    `;
    const map: Record<string, { revenue: number; orders: number }> = {};
    for (const row of rows) {
      const key = new Date(row.date).toISOString().slice(0, 10);
      map[key] = { revenue: parseFloat(row.revenue), orders: parseInt(row.orders) };
    }
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartData.push({ date: key, revenue: map[key]?.revenue ?? 0, orders: map[key]?.orders ?? 0 });
    }
    return NextResponse.json(chartData);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
