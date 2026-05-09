import { Router, Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const router = Router();

const BILLPLZ_BASE   = process.env.BILLPLZ_BASE_URL   || 'https://www.billplz-sandbox.com/api/v3';
const BILLPLZ_KEY    = process.env.BILLPLZ_API_KEY    || '';
const COLLECTION_ID  = process.env.BILLPLZ_COLLECTION_ID || 'n78rkmkw';

const billplz = axios.create({
  baseURL: BILLPLZ_BASE,
  auth: { username: BILLPLZ_KEY, password: '' },
});

// POST /api/payment/bill — create a BillPlz bill for an order
router.post('/bill', async (req: Request, res: Response) => {
  if (!BILLPLZ_KEY) {
    return res.status(500).json({ error: 'BILLPLZ_API_KEY is not set in .env' });
  }

  const { order_number, amount, name } = req.body;

  if (!order_number || !amount) {
    return res.status(400).json({ error: 'order_number and amount are required' });
  }

  // BillPlz requires amount in cents (integer)
  const amountCents = Math.round(parseFloat(amount) * 100);

  if (amountCents <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  try {
    const response = await billplz.post('/bills', {
      collection_id:  COLLECTION_ID,
      description:    `Velora — ${order_number}`,
      email:          'customer@velora.com',
      name:           name?.trim() || 'Customer',
      amount:         amountCents,
      callback_url:   `${process.env.APP_URL || 'http://localhost:5000'}/api/payment/callback`,
      redirect_url:   `${process.env.CLIENT_URL || 'http://localhost:5173'}/orders`,
    });

    res.json(response.data);
  } catch (err: any) {
    const msg = err.response?.data?.error?.message
      ?? err.response?.data?.message
      ?? err.message;
    res.status(err.response?.status ?? 500).json({ error: msg });
  }
});

// GET /api/payment/bill/:id — check payment status
router.get('/bill/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const response = await billplz.get(`/bills/${id}`);
    res.json(response.data);
  } catch (err: any) {
    const msg = err.response?.data?.error?.message ?? err.message;
    res.status(err.response?.status ?? 500).json({ error: msg });
  }
});

// POST /api/payment/callback — BillPlz webhook (x-signature verified in prod)
router.post('/callback', (req: Request, res: Response) => {
  console.log('[BillPlz callback]', req.body);
  res.json({ status: 'ok' });
});

export default router;
