import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const BILLPLZ_KEY = process.env.BILLPLZ_API_KEY || '';
  const BILLPLZ_BASE = process.env.BILLPLZ_BASE_URL || 'https://www.billplz.com/api/v3';

  try {
    const billplz = axios.create({ baseURL: BILLPLZ_BASE, auth: { username: BILLPLZ_KEY, password: '' } });
    const response = await billplz.get(`/bills/${params.id}`);
    return NextResponse.json(response.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.response?.status ?? 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
