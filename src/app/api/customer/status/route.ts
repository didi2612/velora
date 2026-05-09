import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Shared item aggregation SQL fragment (inline to keep template literals clean)
async function getOrderWithItems(sql: ReturnType<typeof getDb>, where: string, params: unknown[]) {
  // We build this via raw neon — kept intentionally separate for clarity
  void where; void params;
  return sql;
}
void getOrderWithItems; // unused helper placeholder

export async function GET() {
  const sql = getDb();

  try {
    // ── 1. Just paid in the last 12 seconds (bill_id may or may not exist) ──
    try {
      const justPaid = await sql`
        SELECT o.id, o.order_number, o.total,
          COALESCE(
            json_agg(
              json_build_object('item_name', oi.item_name, 'quantity', oi.quantity,
                'unit_price', oi.unit_price, 'subtotal', oi.subtotal)
              ORDER BY oi.created_at ASC
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
          AND o.bill_id IS NOT NULL
          AND o.updated_at > NOW() - INTERVAL '12 seconds'
        GROUP BY o.id
        ORDER BY o.updated_at DESC
        LIMIT 1
      `;
      if (justPaid.length > 0) {
        return NextResponse.json({ status: 'paid', order: justPaid[0] });
      }
    } catch { /* bill_id column not yet added — skip */ }

    // ── 2. Payment in progress: pending order with a bill URL ──
    try {
      const withBill = await sql`
        SELECT o.id, o.order_number, o.total, o.bill_url,
          COALESCE(
            json_agg(
              json_build_object('item_name', oi.item_name, 'quantity', oi.quantity,
                'unit_price', oi.unit_price, 'subtotal', oi.subtotal)
              ORDER BY oi.created_at ASC
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'pending'
          AND o.bill_url IS NOT NULL
          AND o.bill_created_at > NOW() - INTERVAL '30 minutes'
        GROUP BY o.id
        ORDER BY o.bill_created_at DESC
        LIMIT 1
      `;
      if (withBill.length > 0) {
        return NextResponse.json({ status: 'pending', order: withBill[0] });
      }
    } catch { /* bill_url column not yet added — run db/migrate_bill_columns.sql */ }

    // ── 3. Order being built (any pending order modified in the last hour) ──
    const building = await sql`
      SELECT o.id, o.order_number, o.total,
        COALESCE(
          json_agg(
            json_build_object('item_name', oi.item_name, 'quantity', oi.quantity,
              'unit_price', oi.unit_price, 'subtotal', oi.subtotal)
            ORDER BY oi.created_at ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'pending'
        AND o.created_at > NOW() - INTERVAL '1 hour'
      GROUP BY o.id
      ORDER BY o.updated_at DESC
      LIMIT 1
    `;
    if (building.length > 0) {
      return NextResponse.json({ status: 'ordering', order: building[0] });
    }

    return NextResponse.json({ status: 'idle' });

  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    );
  }
}
