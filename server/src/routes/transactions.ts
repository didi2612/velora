import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET all transactions
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200'
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET summary stats for dashboard
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const [totalRev, todayRev, totalOrders, todayOrders, totalItems, pendingOrders] =
      await Promise.all([
        pool.query("SELECT COALESCE(SUM(amount), 0) AS val FROM transactions"),
        pool.query("SELECT COALESCE(SUM(amount), 0) AS val FROM transactions WHERE created_at::date = CURRENT_DATE"),
        pool.query("SELECT COUNT(*) AS val FROM orders"),
        pool.query("SELECT COUNT(*) AS val FROM orders WHERE created_at::date = CURRENT_DATE"),
        pool.query("SELECT COUNT(*) AS val FROM items"),
        pool.query("SELECT COUNT(*) AS val FROM orders WHERE status = 'pending'"),
      ]);

    res.json({
      totalRevenue:  parseFloat(totalRev.rows[0].val),
      todayRevenue:  parseFloat(todayRev.rows[0].val),
      totalOrders:   parseInt(totalOrders.rows[0].val),
      todayOrders:   parseInt(todayOrders.rows[0].val),
      totalItems:    parseInt(totalItems.rows[0].val),
      pendingOrders: parseInt(pendingOrders.rows[0].val),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET chart data — revenue grouped by day
router.get('/chart', async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 7));
  try {
    const result = await pool.query(
      `SELECT
         DATE(created_at AT TIME ZONE 'UTC') AS date,
         COALESCE(SUM(amount), 0)            AS revenue,
         COUNT(*)                            AS orders
       FROM transactions
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY DATE(created_at AT TIME ZONE 'UTC')
       ORDER BY date ASC`,
      [days]
    );

    // Build full date range with zeroes for days with no transactions
    const map: Record<string, { revenue: number; orders: number }> = {};
    for (const row of result.rows) {
      const key = new Date(row.date).toISOString().slice(0, 10);
      map[key] = { revenue: parseFloat(row.revenue), orders: parseInt(row.orders) };
    }

    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartData.push({ date: key, revenue: map[key]?.revenue ?? 0, orders: map[key]?.orders ?? 0 });
    }

    res.json(chartData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a transaction
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
