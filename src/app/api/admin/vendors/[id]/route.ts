import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return unauthorized();

  const { status } = await req.json();
  if (!['active', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const sql = getDb();
  const [user] = await sql`
    UPDATE users SET status = ${status} WHERE id = ${parseInt(params.id)} AND role = 'vendor' RETURNING id, email, status
  `;
  if (!user) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  return NextResponse.json(user);
}
