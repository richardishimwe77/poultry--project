-- ==========================================================
-- Poultry Farm — Relational Database Schema
-- ==========================================================
-- Relationships:
--   houses  1──* sensor_readings   (a house has many readings)
--   houses  1──* logs              (a house has many log entries)
--   admin   1──* sensor_readings   (null = ESP32 auto-inserted)
--   admin   1──* logs              (null = system-generated)
-- ==========================================================

-- 1. HOUSES (poultry houses / zones)
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_houses_name ON houses (name);

-- Seed a default house
INSERT INTO houses (name, location) VALUES ('Main House', 'Sector A')
ON CONFLICT DO NOTHING;

-- 2. ADMIN / USERS
CREATE TABLE IF NOT EXISTS admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON admin (email);

-- 3. SENSOR READINGS
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  temperature DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION NOT NULL,
  air_quality INTEGER NOT NULL,
  fan_status BOOLEAN DEFAULT false,
  created_by UUID REFERENCES admin(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_house ON sensor_readings (house_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_by ON sensor_readings (created_by);

-- 4. SYSTEM LOGS
CREATE TABLE IF NOT EXISTS logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admin(id) ON DELETE SET NULL,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_admin ON logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_house ON logs (house_id);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs (type);

-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Houses
CREATE POLICY IF NOT EXISTS "Allow anon select houses" ON houses
  FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow auth insert houses" ON houses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow auth update houses" ON houses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow auth delete houses" ON houses
  FOR DELETE TO authenticated USING (true);

-- Admin (anon allowed — auth enforced at API route level)
CREATE POLICY IF NOT EXISTS "Allow anon select admin" ON admin
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon insert admin" ON admin
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow anon update admin" ON admin
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow anon delete admin" ON admin
  FOR DELETE TO anon, authenticated USING (true);

-- Sensor readings: full access (auth enforced at API route level)
CREATE POLICY IF NOT EXISTS "Allow anon inserts sensor_readings" ON sensor_readings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow anon selects sensor_readings" ON sensor_readings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon deletes sensor_readings" ON sensor_readings
  FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon updates sensor_readings" ON sensor_readings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Logs: full access (auth enforced at API route level)
CREATE POLICY IF NOT EXISTS "Allow anon inserts logs" ON logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow anon selects logs" ON logs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon deletes logs" ON logs
  FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Allow anon updates logs" ON logs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Grants
GRANT USAGE ON SEQUENCE sensor_readings_id_seq TO anon;
GRANT USAGE ON SEQUENCE logs_id_seq TO anon;
GRANT USAGE ON SEQUENCE sensor_readings_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE logs_id_seq TO authenticated;
