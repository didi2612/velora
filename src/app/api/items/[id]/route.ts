import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, price, category, description, stock } = await req.json();
    if (!name || price === undefined) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    const sql = getDb();
    const [item] = await sql`
      UPDATE items SET name = ${name.trim()}, price = ${parseFloat(price)}, category = ${category?.trim() || 'General'}, description = ${description?.trim() || null}, stock = ${parseInt(stock) || 0}
      WHERE id = ${parseInt(params.id)} RETURNING *
    `;
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = getDb();
    const [item] = await sql`DELETE FROM items WHERE id = ${parseInt(params.id)} RETURNING id`;
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ message: 'Item deleted' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
