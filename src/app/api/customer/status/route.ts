import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore(); // prevent Next.js Data Cache from serving a stale snapshot
  const sql = getDb();

  // ── 1. Any order completed in the last 15 s → "paid" state ───────────────
  // Intentionally does NOT check bill_id so it works without the migration.
  try {
    const rows = await sql`
      SELECT o.id, o.order_number, o.total,
        COALESCE(
          json_agg(
            json_build_object('item_name',oi.item_name,'quantity',oi.quantity,
              'unit_price',oi.unit_price,'subtotal',oi.subtotal)
            ORDER BY oi.created_at ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'completed'
        AND o.updated_at > NOW() - INTERVAL '15 seconds'
      GROUP BY o.id
      ORDER BY o.updated_at DESC
      LIMIT 1
    `;
    if (rows.length > 0) return NextResponse.json({ status: 'paid', order: rows[0] });
  } catch (e) {
    console.error('[customer/status] paid-check:', e);
  }

  // ── 2. Most recent pending order (no time constraint) ────────────────────
  let activeOrder: Record<string, unknown> | null = null;
  try {
    const rows = await sql`
      SELECT o.id, o.order_number, o.total,
        COALESCE(
          json_agg(
            json_build_object('item_name',oi.item_name,'quantity',oi.quantity,
              'unit_price',oi.unit_price,'subtotal',oi.subtotal)
            ORDER BY oi.created_at ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'pending'
      GROUP BY o.id
      ORDER BY o.updated_at DESC
      LIMIT 1
    `;
    if (rows.length > 0) activeOrder = rows[0] as Record<string, unknown>;
  } catch (e) {
    console.error('[customer/status] pending-order:', e);
    return NextResponse.json({ status: 'idle' });
  }

  if (!activeOrder) return NextResponse.json({ status: 'idle' });

  // ── 3. Does that order have a bill_url? (needs migration to exist) ────────
  try {
    const rows = await sql`
      SELECT bill_url FROM orders
      WHERE id = ${activeOrder.id as number} AND bill_url IS NOT NULL
      LIMIT 1
    `;
    if (rows.length > 0 && rows[0].bill_url) {
      return NextResponse.json({
        status: 'pending',
        order: { ...activeOrder, bill_url: rows[0].bill_url },
      });
    }
  } catch {
    // bill_url column not yet created — fall through to 'ordering'
  }

  // ── 4. No bill yet → order is being built ────────────────────────────────
  return NextResponse.json({ status: 'ordering', order: activeOrder });
}
