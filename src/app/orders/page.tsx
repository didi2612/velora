import { getDb } from '@/lib/db';
import OrdersClient from './OrdersClient';
import type { Item, Order } from '@/types';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const sql = getDb();
  const [itemRows, orderRows] = await Promise.all([
    sql`SELECT * FROM items ORDER BY category ASC, name ASC`,
    sql`
      SELECT o.*,
        COALESCE(
          json_agg(
            json_build_object('id',oi.id,'item_id',oi.item_id,'item_name',oi.item_name,
              'quantity',oi.quantity,'unit_price',oi.unit_price,'subtotal',oi.subtotal)
            ORDER BY oi.created_at ASC
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `,
  ]);
  return (
    <OrdersClient
      initialItems={itemRows as unknown as Item[]}
      initialOrders={orderRows as unknown as Order[]}
    />
  );
}
