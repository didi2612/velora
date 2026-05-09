import type { Item, Order, OrderItem, Transaction, Summary, ChartPoint } from '../types';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json().catch(() => ({ error: 'Network error' }));
  if (!res.ok) throw new Error(body.error ?? 'Request failed');
  return body as T;
}

// ── Items ──────────────────────────────────────────────────────────────
export const itemsApi = {
  getAll: () => req<Item[]>('/items'),

  create: (data: Omit<Item, 'id' | 'created_at' | 'updated_at'>) =>
    req<Item>('/items', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Omit<Item, 'id' | 'created_at' | 'updated_at'>) =>
    req<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number) =>
    req<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),
};

// ── Orders ─────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: () => req<Order[]>('/orders'),

  create: (notes?: string) =>
    req<Order>('/orders', { method: 'POST', body: JSON.stringify({ notes }) }),

  addItem: (orderId: number, itemId: number, quantity = 1) =>
    req<OrderItem>(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity }),
    }),

  updateItemQty: (orderId: number, oiId: number, quantity: number) =>
    req<OrderItem>(`/orders/${orderId}/items/${oiId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (orderId: number, oiId: number) =>
    req<{ message: string }>(`/orders/${orderId}/items/${oiId}`, { method: 'DELETE' }),

  updateStatus: (orderId: number, status: Order['status']) =>
    req<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (orderId: number) =>
    req<{ message: string }>(`/orders/${orderId}`, { method: 'DELETE' }),
};

// ── Payment ────────────────────────────────────────────────────────────
export interface BillPlzBill {
  id: string;
  url: string;
  paid: boolean;
  state: string;
  amount: number;
  paid_amount: number;
  name: string;
  email: string;
  description: string;
}

export const paymentApi = {
  createBill: (order_number: string, amount: number, name?: string) =>
    req<BillPlzBill>('/payment/bill', {
      method: 'POST',
      body: JSON.stringify({ order_number, amount, name }),
    }),

  getBill: (billId: string) =>
    req<BillPlzBill>(`/payment/bill/${billId}`),
};

// ── Transactions ───────────────────────────────────────────────────────
export const transactionsApi = {
  getAll:     () => req<Transaction[]>('/transactions'),
  getSummary: () => req<Summary>('/transactions/summary'),
  getChart:   (days = 7) => req<ChartPoint[]>(`/transactions/chart?days=${days}`),
  delete:     (id: number) => req<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
};
