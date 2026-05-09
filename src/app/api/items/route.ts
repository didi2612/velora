import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const items = await sql`SELECT * FROM items ORDER BY category ASC, name ASC`;
    return NextResponse.json(items);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, price, category, description, stock } = await req.json();
    if (!name || price === undefined) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    const sql = getDb();
    const [item] = await sql`
      INSERT INTO items (name, price, category, description, stock)
      VALUES (${name.trim()}, ${parseFloat(price)}, ${category?.trim() || 'General'}, ${description?.trim() || null}, ${parseInt(stock) || 0})
      RETURNING *
    `;
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
