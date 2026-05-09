import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const txns = await sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json(txns);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
