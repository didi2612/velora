import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY category ASC, name ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { name, price, category, description, stock } = req.body;
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO items (name, price, category, description, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), parseFloat(price), category?.trim() || 'General', description?.trim() || null, parseInt(stock) || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, price, category, description, stock } = req.body;
  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  try {
    const result = await pool.query(
      `UPDATE items
       SET name = $1, price = $2, category = $3, description = $4, stock = $5
       WHERE id = $6 RETURNING *`,
      [name.trim(), parseFloat(price), category?.trim() || 'General', description?.trim() || null, parseInt(stock) || 0, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
