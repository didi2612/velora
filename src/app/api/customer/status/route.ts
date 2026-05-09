import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();

    // 1. Was an order just paid in the last 12 seconds? Show success briefly.
    const justPaid = await sql`
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
      WHERE o.status    = 'completed'
        AND o.bill_id   IS NOT NULL
        AND o.updated_at > NOW() - INTERVAL '12 seconds'
      GROUP BY o.id
      ORDER BY o.updated_at DESC
      LIMIT 1
    `;

    if (justPaid.length > 0) {
      return NextResponse.json({ status: 'paid', order: justPaid[0] });
    }

    // 2. Is there an active pending payment (bill created within last 30 min)?
    const active = await sql`
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
      WHERE o.status         = 'pending'
        AND o.bill_url       IS NOT NULL
        AND o.bill_created_at > NOW() - INTERVAL '30 minutes'
      GROUP BY o.id
      ORDER BY o.bill_created_at DESC
      LIMIT 1
    `;

    if (active.length > 0) {
      return NextResponse.json({ status: 'pending', order: active[0] });
    }

    return NextResponse.json({ status: 'idle' });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    );
  }
}
