import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    const orderId = parseInt(params.id);
    let order;
    if (session.role === 'admin') {
      [order] = await sql`DELETE FROM orders WHERE id = ${orderId} RETURNING id`;
    } else {
      [order] = await sql`DELETE FROM orders WHERE id = ${orderId} AND vendor_id = ${session.id} RETURNING id`;
    }
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ message: 'Order deleted' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
