-- ============================================================
-- Finanzas Pro-BI — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TRANSACTIONS (movimientos de dinero)
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date ON transactions (user_id, date DESC);
CREATE INDEX idx_transactions_user_type ON transactions (user_id, type);

-- 2. MONTHLY GOALS (metas de ahorro por mes)
CREATE TABLE IF NOT EXISTS monthly_goals (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         SMALLINT NOT NULL,
  savings_goal DECIMAL(12, 2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);

-- 3. CATEGORY BUDGETS (presupuesto por categoría, ligado a un mes)
CREATE TABLE IF NOT EXISTS category_budgets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_goal_id UUID REFERENCES monthly_goals(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category        TEXT NOT NULL,
  budget_amount   DECIMAL(12, 2) NOT NULL CHECK (budget_amount >= 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (monthly_goal_id, category)
);

-- ============================================================
-- ROW LEVEL SECURITY — cada usuario solo ve sus datos
-- ============================================================

ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE POLICY "own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Monthly Goals
CREATE POLICY "own_goals" ON monthly_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Category Budgets
CREATE POLICY "own_budgets" ON category_budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DATOS DE EJEMPLO (opcional — ejecutar separado)
-- ============================================================
/*
INSERT INTO transactions (user_id, type, amount, category, description, date)
VALUES
  (auth.uid(), 'income',  3000.00, 'ingreso',    'Sueldo Mayo',       '2026-05-01'),
  (auth.uid(), 'expense',  850.00, 'alquiler',   'Alquiler Mayo',     '2026-05-02'),
  (auth.uid(), 'expense',  320.00, 'comida',     'Supermercado',      '2026-05-05'),
  (auth.uid(), 'expense',   45.00, 'transporte', 'SUBE / Nafta',      '2026-05-07'),
  (auth.uid(), 'expense',   30.00, 'gym',        'Cuota Gym',         '2026-05-08'),
  (auth.uid(), 'expense',  200.00, 'deudas',     'Cuota préstamo',    '2026-05-10'),
  (auth.uid(), 'expense',   85.00, 'varios',     'Netflix + Spotify', '2026-05-12');
*/
