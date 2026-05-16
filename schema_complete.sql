-- ============================================================
-- Finanzas Pro-BI — Schema Completo (v3)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Crea todas las tablas, RLS, índices, triggers y activa realtime.
-- ============================================================

-- ============================================================
-- 1. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category    TEXT        NOT NULL,
  description TEXT,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions (user_id, type, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions (user_id, category);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_transactions" ON transactions;
CREATE POLICY "own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. MONTHLY GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_goals (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month        SMALLINT    NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         SMALLINT    NOT NULL,
  savings_goal DECIMAL(12, 2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_goals_user ON monthly_goals (user_id, year, month);

ALTER TABLE monthly_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_goals" ON monthly_goals;
CREATE POLICY "own_goals" ON monthly_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. CATEGORY BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS category_budgets (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_goal_id UUID        REFERENCES monthly_goals(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID        REFERENCES auth.users(id)    ON DELETE CASCADE NOT NULL,
  category        TEXT        NOT NULL,
  budget_amount   DECIMAL(12, 2) NOT NULL CHECK (budget_amount >= 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (monthly_goal_id, category)
);

CREATE INDEX IF NOT EXISTS idx_category_budgets_goal ON category_budgets (monthly_goal_id);

ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_budgets" ON category_budgets;
CREATE POLICY "own_budgets" ON category_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id                 UUID  REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_currency TEXT  NOT NULL DEFAULT 'ARS'
    CHECK (preferred_currency IN ('ARS', 'USD', 'EUR')),
  display_name       TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_profile" ON user_profiles;
CREATE POLICY "own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger: auto-actualiza updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: crea perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, preferred_currency)
  VALUES (NEW.id, 'ARS')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 5. CUSTOM CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_categories (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT    NOT NULL,
  emoji      TEXT    NOT NULL DEFAULT '📌',
  color      TEXT    NOT NULL DEFAULT '#6366f1',
  sort_order INT     DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_user ON custom_categories (user_id, sort_order);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_custom_categories" ON custom_categories;
CREATE POLICY "own_custom_categories" ON custom_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. REALTIME — habilitar en todas las tablas
-- ============================================================
-- Permite que el cliente reciba cambios en tiempo real vía WebSocket.
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE monthly_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE category_budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE custom_categories;

-- ============================================================
-- 7. VERIFICACIÓN FINAL
-- ============================================================
SELECT
  t.table_name,
  c.relrowsecurity AS rls_enabled,
  EXISTS (
    SELECT 1 FROM pg_publication_tables pt
    WHERE pt.tablename = t.table_name AND pt.pubname = 'supabase_realtime'
  ) AS realtime_enabled
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = 'public'::regnamespace
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'transactions', 'monthly_goals', 'category_budgets',
    'user_profiles', 'custom_categories'
  )
ORDER BY t.table_name;
