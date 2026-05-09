import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getDb();
    const [order] = await sql`DELETE FROM orders WHERE id = ${parseInt(params.id)} RETURNING id`;
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ message: 'Order deleted' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
