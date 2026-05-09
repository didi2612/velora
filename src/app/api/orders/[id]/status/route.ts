import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const sql = getDb();
    const [order] = await sql`UPDATE orders SET status = ${status} WHERE id = ${parseInt(params.id)} RETURNING *`;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (status === 'completed') {
      await sql`INSERT INTO transactions (order_id, order_number, amount) VALUES (${order.id}, ${order.order_number}, ${order.total})`;
    }
    return NextResponse.json(order);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
