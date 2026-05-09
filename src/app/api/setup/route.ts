import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  const sql = getDb();

  // Only allow if no admin exists
  const [existing] = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  if (existing) return NextResponse.json({ error: 'Admin already exists' }, { status: 403 });

  const hashed = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (email, password, role, status) VALUES (${email}, ${hashed}, 'admin', 'active') RETURNING id, email, role
  `;
  return NextResponse.json({ success: true, user });
}
