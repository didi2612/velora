import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.log('[BillPlz callback]', body);
  return NextResponse.json({ status: 'ok' });
}
