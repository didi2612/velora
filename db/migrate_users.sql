-- Run in Neon SQL Editor
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'vendor' CHECK (role IN ('admin','vendor')),
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER      UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name       VARCHAR(255) NOT NULL,
  phone_number    VARCHAR(30)  NOT NULL,
  bank_name       VARCHAR(100) NOT NULL,
  bank_account_no VARCHAR(50)  NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE items        ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES users(id);
ALTER TABLE orders       ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES users(id);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_profiles_updated_at ON vendor_profiles;
CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
