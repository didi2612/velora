import { NextRequest, NextResponse } from 'next/server';
import { getDb, recalcOrderTotal } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { item_id, quantity = 1 } = await req.json();
    if (!item_id) return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    const sql = getDb();
    const orderId = parseInt(params.id);
    const qty = Math.max(1, parseInt(quantity));

    const [item] = await sql`SELECT * FROM items WHERE id = ${parseInt(item_id)}`;
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const [existing] = await sql`SELECT * FROM order_items WHERE order_id = ${orderId} AND item_id = ${parseInt(item_id)}`;

    let orderItem;
    if (existing) {
      const newQty = existing.quantity + qty;
      const newSub = parseFloat(item.price) * newQty;
      const [updated] = await sql`UPDATE order_items SET quantity = ${newQty}, subtotal = ${newSub} WHERE id = ${existing.id} RETURNING *`;
      orderItem = updated;
    } else {
      const sub = parseFloat(item.price) * qty;
      const [inserted] = await sql`
        INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, subtotal)
        VALUES (${orderId}, ${parseInt(item_id)}, ${item.name}, ${qty}, ${item.price}, ${sub}) RETURNING *
      `;
      orderItem = inserted;
    }

    await recalcOrderTotal(sql, orderId);
    return NextResponse.json(orderItem, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
