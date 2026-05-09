import { NextRequest, NextResponse } from 'next/server';
import { getDb, makeOrderNumber } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const orders = await sql`
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
    return NextResponse.json(orders);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json().catch(() => ({}));
    const sql = getDb();
    const [order] = await sql`
      INSERT INTO orders (order_number, notes) VALUES (${makeOrderNumber()}, ${notes || null}) RETURNING *
    `;
    return NextResponse.json({ ...order, items: [] }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
