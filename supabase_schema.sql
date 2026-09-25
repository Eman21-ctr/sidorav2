-- ============================================================
-- SIDORA - Supabase Database Schema
-- Sistem Informasi Digital Pengobatan Rawat Jalan
-- ============================================================
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Tabel Pasien
-- Data pasien lengkap disimpan sebagai JSONB untuk kompatibilitas
-- langsung dengan TypeScript interface tanpa perlu mapping field.
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Template Pesan
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Log Pesan WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Konfigurasi Otomasi (Singleton - 1 baris saja)
CREATE TABLE IF NOT EXISTS automation_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Konfigurasi BSP/Gateway WhatsApp (Singleton)
CREATE TABLE IF NOT EXISTS bsp_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Analitik Harian
CREATE TABLE IF NOT EXISTS daily_analytics (
  date TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Kontak Tester / Penguji
CREATE TABLE IF NOT EXISTS tester_contacts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created 
  ON whatsapp_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_data_nama 
  ON patients USING GIN ((data->'nama'));

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_data_patient 
  ON whatsapp_messages USING GIN ((data->'patientId'));

-- ============================================================
-- DISABLE RLS (Mode Prototype - akses terbuka)
-- ============================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bsp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for anon/authenticated (prototype mode)
CREATE POLICY "Allow all for prototype" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prototype" ON message_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prototype" ON whatsapp_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prototype" ON automation_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prototype" ON bsp_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prototype" ON daily_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for prototype" ON tester_contacts FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DONE! Tabel siap digunakan.
-- ============================================================
