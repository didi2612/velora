import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getDb();
    const [txn] = await sql`DELETE FROM transactions WHERE id = ${parseInt(params.id)} RETURNING id`;
    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
