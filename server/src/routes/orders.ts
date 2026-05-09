import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

function makeOrderNumber(): string {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${dateStr}-${rand}`;
}

async function recalcTotal(orderId: string | number, client: typeof pool | import('pg').PoolClient) {
  await (client as any).query(
    `UPDATE orders
     SET total = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = $1)
     WHERE id = $1`,
    [orderId]
  );
}

// GET all orders with their items
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', oi.id,
               'item_id', oi.item_id,
               'item_name', oi.item_name,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price,
               'subtotal', oi.subtotal
             ) ORDER BY oi.created_at ASC
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new order
router.post('/', async (req: Request, res: Response) => {
  const { notes } = req.body;
  const orderNumber = makeOrderNumber();
  try {
    const result = await pool.query(
      'INSERT INTO orders (order_number, notes) VALUES ($1, $2) RETURNING *',
      [orderNumber, notes?.trim() || null]
    );
    res.status(201).json({ ...result.rows[0], items: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add item to order
router.post('/:id/items', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { item_id, quantity = 1 } = req.body;
  if (!item_id) return res.status(400).json({ error: 'item_id is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemRes = await client.query('SELECT * FROM items WHERE id = $1', [item_id]);
    if (itemRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Item not found' });
    }
    const item = itemRes.rows[0];
    const qty = Math.max(1, parseInt(quantity));

    // If item already in order, increment quantity
    const existingRes = await client.query(
      'SELECT * FROM order_items WHERE order_id = $1 AND item_id = $2',
      [id, item_id]
    );

    let orderItem;
    if (existingRes.rows.length > 0) {
      const newQty = existingRes.rows[0].quantity + qty;
      const newSub = parseFloat(item.price) * newQty;
      const upd = await client.query(
        'UPDATE order_items SET quantity = $1, subtotal = $2 WHERE id = $3 RETURNING *',
        [newQty, newSub, existingRes.rows[0].id]
      );
      orderItem = upd.rows[0];
    } else {
      const sub = parseFloat(item.price) * qty;
      const ins = await client.query(
        `INSERT INTO order_items (order_id, item_id, item_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, item_id, item.name, qty, item.price, sub]
      );
      orderItem = ins.rows[0];
    }

    await recalcTotal(id, client);
    await client.query('COMMIT');
    res.status(201).json(orderItem);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update quantity of an order item
router.put('/:id/items/:oiId', async (req: Request, res: Response) => {
  const { id, oiId } = req.params;
  const { quantity } = req.body;
  const qty = Math.max(1, parseInt(quantity));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const oiRes = await client.query(
      'SELECT * FROM order_items WHERE id = $1 AND order_id = $2',
      [oiId, id]
    );
    if (oiRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order item not found' });
    }
    const newSub = parseFloat(oiRes.rows[0].unit_price) * qty;
    const result = await client.query(
      'UPDATE order_items SET quantity = $1, subtotal = $2 WHERE id = $3 RETURNING *',
      [qty, newSub, oiId]
    );
    await recalcTotal(id, client);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE remove item from order
router.delete('/:id/items/:oiId', async (req: Request, res: Response) => {
  const { id, oiId } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM order_items WHERE id = $1 AND order_id = $2', [oiId, id]);
    await recalcTotal(id, client);
    await client.query('COMMIT');
    res.json({ message: 'Item removed' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PATCH update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['pending', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = result.rows[0];

    if (status === 'completed') {
      await client.query(
        'INSERT INTO transactions (order_id, order_number, amount) VALUES ($1, $2, $3)',
        [order.id, order.order_number, order.total]
      );
    }

    await client.query('COMMIT');
    res.json(order);
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE order
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
