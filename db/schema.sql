-- ============================================================
-- Velora Cashier System — Database Schema (Neon PostgreSQL)
-- Run this in your Neon SQL Editor or via psql:
--   psql $DATABASE_URL -f db/schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category    VARCHAR(100) NOT NULL DEFAULT 'General',
  description TEXT,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id           SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'cancelled')),
  total        DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id    INTEGER REFERENCES items(id) ON DELETE SET NULL,
  item_name  VARCHAR(255) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal   DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  order_number VARCHAR(50) NOT NULL,
  amount       DECIMAL(10, 2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample seed data
INSERT INTO items (name, price, category, description, stock) VALUES
  ('Americano',      3.50, 'Coffee',  'Rich black espresso with hot water',      100),
  ('Latte',          4.50, 'Coffee',  'Espresso with velvety steamed milk',       100),
  ('Cappuccino',     4.00, 'Coffee',  'Double espresso with thick foam',          100),
  ('Flat White',     4.25, 'Coffee',  'Ristretto with micro-foam milk',           100),
  ('Green Tea',      3.00, 'Tea',     'Premium Japanese green tea',                80),
  ('Chamomile Tea',  2.75, 'Tea',     'Soothing floral herbal blend',              80),
  ('Croissant',      2.50, 'Pastry',  'Buttery classic French pastry',             50),
  ('Blueberry Muffin', 3.25, 'Pastry', 'Freshly baked with wild blueberries',     40),
  ('Club Sandwich',  6.50, 'Food',    'Triple-decker with chicken & avocado',      30),
  ('Caesar Salad',   7.00, 'Food',    'Romaine, parmesan & house Caesar dressing', 25)
ON CONFLICT DO NOTHING;
