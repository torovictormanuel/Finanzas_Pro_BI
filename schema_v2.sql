-- ============================================================
-- Finanzas Pro-BI v2 — Migraciones adicionales
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 4. USER PROFILES (preferencias por usuario: moneda, etc.)
CREATE TABLE IF NOT EXISTS user_profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_currency TEXT NOT NULL DEFAULT 'USD'
    CHECK (preferred_currency IN ('USD', 'EUR', 'ARS')),
  display_name      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, preferred_currency)
  VALUES (NEW.id, 'USD')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. CUSTOM CATEGORIES (categorías personalizadas por usuario)
CREATE TABLE IF NOT EXISTS custom_categories (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '📌',
  color      TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INT  DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_custom_categories" ON custom_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. INDEX extras para performance
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(user_id, type, date DESC);

-- ============================================================
-- VERIFICAR tablas creadas
-- ============================================================
SELECT table_name, row_security
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE table_schema = 'public'
  AND table_name IN ('transactions','monthly_goals','category_budgets','user_profiles','custom_categories');
