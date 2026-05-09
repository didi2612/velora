import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const BILLPLZ_KEY    = process.env.BILLPLZ_API_KEY    || '';
  const BILLPLZ_BASE   = process.env.BILLPLZ_BASE_URL   || 'https://www.billplz.com/api/v3';
  const COLLECTION_ID  = process.env.BILLPLZ_COLLECTION_ID || '';
  const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!BILLPLZ_KEY) return NextResponse.json({ error: 'BILLPLZ_API_KEY is not set' }, { status: 500 });

  const { order_number, amount, name } = await req.json();
  const amountCents = Math.round(parseFloat(amount) * 100);
  if (amountCents <= 0) return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });

  try {
    const billplz = axios.create({ baseURL: BILLPLZ_BASE, auth: { username: BILLPLZ_KEY, password: '' } });
    const response = await billplz.post('/bills', {
      collection_id: COLLECTION_ID,
      description:   `Velora — ${order_number}`,
      email:         'customer@velora.com',
      name:          name?.trim() || 'Customer',
      amount:        amountCents,
      callback_url:  `${APP_URL}/api/payment/callback`,
      redirect_url:  `${APP_URL}/orders`,
    });

    const bill = response.data;

    // Save bill info to the order so the customer display can pick it up
    try {
      const sql = getDb();
      await sql`
        UPDATE orders
        SET bill_id = ${bill.id}, bill_url = ${bill.url}, bill_created_at = NOW()
        WHERE order_number = ${order_number}
      `;
    } catch { /* non-critical — don't fail the response if DB update fails */ }

    return NextResponse.json(bill);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.error?.message ?? err.message;
      return NextResponse.json({ error: msg }, { status: err.response?.status ?? 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
