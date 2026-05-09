export interface Item {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_id: number | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  order_id: number | null;
  order_number: string;
  amount: number;
  created_at: string;
}

export interface Summary {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalItems: number;
  pendingOrders: number;
}

export interface ChartPoint {
  date: string;
  revenue: number;
  orders: number;
}
