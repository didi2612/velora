import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return unauthorized();

  const sql = getDb();
  const vendors = await sql`
    SELECT u.id, u.email, u.status, u.created_at,
      vp.shop_name, vp.phone_number, vp.bank_name, vp.bank_account_no
    FROM users u
    LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
    WHERE u.role = 'vendor'
    ORDER BY u.created_at DESC
  `;
  return NextResponse.json(vendors);
}
