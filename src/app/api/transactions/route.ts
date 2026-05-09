import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    let txns;
    if (session.role === 'admin') {
      txns = await sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200`;
    } else {
      txns = await sql`
        SELECT t.* FROM transactions t
        WHERE t.order_id IN (SELECT id FROM orders WHERE vendor_id = ${session.id})
        ORDER BY t.created_at DESC LIMIT 200
      `;
    }
    return NextResponse.json(txns);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
