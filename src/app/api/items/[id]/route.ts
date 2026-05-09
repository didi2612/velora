import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession, unauthorized } from '@/lib/session';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { name, price, category, description, stock } = await req.json();
    if (!name || price === undefined) return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    const sql = getDb();
    const itemId = parseInt(params.id);
    let item;
    if (session.role === 'admin') {
      [item] = await sql`
        UPDATE items SET name = ${name.trim()}, price = ${parseFloat(price)}, category = ${category?.trim() || 'General'}, description = ${description?.trim() || null}, stock = ${parseInt(stock) || 0}
        WHERE id = ${itemId} RETURNING *
      `;
    } else {
      [item] = await sql`
        UPDATE items SET name = ${name.trim()}, price = ${parseFloat(price)}, category = ${category?.trim() || 'General'}, description = ${description?.trim() || null}, stock = ${parseInt(stock) || 0}
        WHERE id = ${itemId} AND vendor_id = ${session.id} RETURNING *
      `;
    }
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const sql = getDb();
    const itemId = parseInt(params.id);
    let item;
    if (session.role === 'admin') {
      [item] = await sql`DELETE FROM items WHERE id = ${itemId} RETURNING id`;
    } else {
      [item] = await sql`DELETE FROM items WHERE id = ${itemId} AND vendor_id = ${session.id} RETURNING id`;
    }
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ message: 'Item deleted' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
