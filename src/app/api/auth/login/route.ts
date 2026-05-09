import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, COOKIE_NAME, COOKIE_OPTIONS, type SessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  const sql = getDb();
  const rows = await sql`
    SELECT u.*, vp.shop_name
    FROM users u
    LEFT JOIN vendor_profiles vp ON vp.user_id = u.id
    WHERE u.email = ${email.toLowerCase().trim()}
    LIMIT 1
  `;
  const user = rows[0];
  if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  if (user.status === 'rejected') return NextResponse.json({ error: 'Your account has been rejected. Contact admin.' }, { status: 403 });

  const session: SessionUser = {
    id: user.id, email: user.email, role: user.role,
    status: user.status, shopName: user.shop_name ?? null,
  };
  const token = await signToken(session);

  const res = NextResponse.json({ user: session });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
