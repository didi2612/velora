import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { vendorId: string } }) {
  try {
    const sql = getDb();
    const [row] = await sql`
      SELECT vp.shop_name FROM vendor_profiles vp
      WHERE vp.user_id = ${parseInt(params.vendorId)}
      LIMIT 1
    `;
    if (!row) return NextResponse.json({ shopName: null });
    return NextResponse.json({ shopName: row.shop_name });
  } catch {
    return NextResponse.json({ shopName: null });
  }
}
