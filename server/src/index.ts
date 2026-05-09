import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import itemsRouter from './routes/items';
import ordersRouter from './routes/orders';
import transactionsRouter from './routes/transactions';
import paymentRouter from './routes/payment';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/items', itemsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/payment', paymentRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n  Velora Server running at http://localhost:${PORT}\n`);
});
