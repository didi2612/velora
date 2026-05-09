import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { status } = await req.json();
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const sql = getDb();
    const orderId = parseInt(params.id);
    let order;
    if (session.role === 'admin') {
      [order] = await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId} RETURNING *`;
    } else {
      [order] = await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId} AND vendor_id = ${session.id} RETURNING *`;
    }
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (status === 'completed') {
      await sql`INSERT INTO transactions (order_id, order_number, amount, vendor_id) VALUES (${order.id}, ${order.order_number}, ${order.total}, ${order.vendor_id})`;
    }
    return NextResponse.json(order);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
