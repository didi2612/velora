import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    let items;
    if (session.role === 'admin') {
      items = await sql`SELECT * FROM items ORDER BY category ASC, name ASC`;
    } else {
      items = await sql`SELECT * FROM items WHERE vendor_id = ${session.id} ORDER BY category ASC, name ASC`;
    }
    return NextResponse.json(items);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { name, price, category, description, stock } = await req.json();
    if (!name || price === undefined) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    const sql = getDb();
    const [item] = await sql`
      INSERT INTO items (name, price, category, description, stock, vendor_id)
      VALUES (${name.trim()}, ${parseFloat(price)}, ${category?.trim() || 'General'}, ${description?.trim() || null}, ${parseInt(stock) || 0}, ${session.id})
      RETURNING *
    `;
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
