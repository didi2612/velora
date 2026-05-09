import { NextRequest, NextResponse } from 'next/server';
import { getDb, recalcOrderTotal } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string; oiId: string } }) {
  try {
    const { quantity } = await req.json();
    const qty = Math.max(1, parseInt(quantity));
    const sql = getDb();
    const orderId = parseInt(params.id);

    const [oi] = await sql`SELECT * FROM order_items WHERE id = ${parseInt(params.oiId)} AND order_id = ${orderId}`;
    if (!oi) return NextResponse.json({ error: 'Order item not found' }, { status: 404 });

    const newSub = parseFloat(oi.unit_price) * qty;
    const [updated] = await sql`UPDATE order_items SET quantity = ${qty}, subtotal = ${newSub} WHERE id = ${parseInt(params.oiId)} RETURNING *`;
    await recalcOrderTotal(sql, orderId);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; oiId: string } }) {
  try {
    const sql = getDb();
    const orderId = parseInt(params.id);
    await sql`DELETE FROM order_items WHERE id = ${parseInt(params.oiId)} AND order_id = ${orderId}`;
    await recalcOrderTotal(sql, orderId);
    return NextResponse.json({ message: 'Item removed' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
