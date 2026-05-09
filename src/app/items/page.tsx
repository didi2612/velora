import { getDb } from '@/lib/db';
import ItemsClient from './ItemsClient';
import type { Item } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM items ORDER BY category ASC, name ASC`;
  return <ItemsClient initialItems={rows as unknown as Item[]} />;
}
