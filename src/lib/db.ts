import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export function makeOrderNumber(): string {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${dateStr}-${rand}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recalcOrderTotal(sql: NeonQueryFunction<any, any>, orderId: number) {
  await sql`
    UPDATE orders
    SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = ${orderId})
    WHERE id = ${orderId}
  `;
}
