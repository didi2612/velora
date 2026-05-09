import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    const txnId = parseInt(params.id);
    let txn;
    if (session.role === 'admin') {
      [txn] = await sql`DELETE FROM transactions WHERE id = ${txnId} RETURNING id`;
    } else {
      [txn] = await sql`
        DELETE FROM transactions WHERE id = ${txnId}
        AND order_id IN (SELECT id FROM orders WHERE vendor_id = ${session.id})
        RETURNING id
      `;
    }
    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
