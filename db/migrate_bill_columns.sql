-- Run this once in your Neon SQL Editor to support the customer display feature
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_id          VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_url         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_created_at  TIMESTAMPTZ;
