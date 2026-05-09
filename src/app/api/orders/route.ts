import { NextRequest, NextResponse } from 'next/server';
import { getDb, makeOrderNumber } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    let orders;
    if (session.role === 'admin') {
      orders = await sql`
        SELECT o.*,
          COALESCE(
            json_agg(
              json_build_object('id', oi.id, 'item_id', oi.item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)
              ORDER BY oi.created_at ASC
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT o.*,
          COALESCE(
            json_agg(
              json_build_object('id', oi.id, 'item_id', oi.item_id, 'item_name', oi.item_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'subtotal', oi.subtotal)
              ORDER BY oi.created_at ASC
            ) FILTER (WHERE oi.id IS NOT NULL), '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.vendor_id = ${session.id}
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
    }
    return NextResponse.json(orders);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { notes } = await req.json().catch(() => ({}));
    const sql = getDb();
    const [order] = await sql`
      INSERT INTO orders (order_number, notes, vendor_id) VALUES (${makeOrderNumber()}, ${notes || null}, ${session.id}) RETURNING *
    `;
    return NextResponse.json({ ...order, items: [] }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
