import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, password, shopName, phoneNumber, bankName, bankAccountNo } = await req.json();

  if (!email || !password || !shopName || !phoneNumber || !bankName || !bankAccountNo) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const sql = getDb();
  const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (email, password, role, status)
    VALUES (${email.toLowerCase().trim()}, ${hashed}, 'vendor', 'pending')
    RETURNING id
  `;
  await sql`
    INSERT INTO vendor_profiles (user_id, shop_name, phone_number, bank_name, bank_account_no)
    VALUES (${user.id}, ${shopName.trim()}, ${phoneNumber.trim()}, ${bankName.trim()}, ${bankAccountNo.trim()})
  `;
  return NextResponse.json({ success: true });
}
