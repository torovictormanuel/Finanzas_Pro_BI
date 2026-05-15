// ─── Catálogo de categorías ───────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'comida',     label: 'Comida',      color: '#f59e0b', emoji: '🍽️' },
  { id: 'alquiler',   label: 'Alquiler',    color: '#ef4444', emoji: '🏠' },
  { id: 'transporte', label: 'Transporte',  color: '#3b82f6', emoji: '🚗' },
  { id: 'deudas',     label: 'Deudas',      color: '#8b5cf6', emoji: '💳' },
  { id: 'gym',        label: 'Gym',         color: '#10b981', emoji: '💪' },
  { id: 'varios',     label: 'Varios',      color: '#64748b', emoji: '📦' },
  { id: 'ingreso',    label: 'Ingreso',     color: '#22c55e', emoji: '💵' },
]

export const EXPENSE_CATEGORIES = CATEGORIES.filter(c => c.id !== 'ingreso')

export const getCategoryInfo = (id) =>
  CATEGORIES.find(c => c.id === id) ?? { id, label: id, color: '#6366f1', emoji: '📌' }

// ─── Estadísticas mensuales ───────────────────────────────────────────────────
export function calcMonthlyStats(transactions, month, year) {
  const filtered = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })

  const income   = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const byCategory = {}
  filtered.filter(t => t.type === 'expense').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + Number(t.amount)
  })

  const savingsRate = income > 0 ? +((income - expenses) / income * 100).toFixed(1) : 0

  return { income, expenses, balance: income - expenses, savingsRate, byCategory, transactions: filtered }
}

// ─── Estadísticas diarias ─────────────────────────────────────────────────────
export function calcDailyStats(transactions, dateStr) {
  const filtered = transactions.filter(t => t.date === dateStr)
  const income   = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  return { income, expenses, balance: income - expenses, transactions: filtered }
}

// ─── Progreso de presupuestos ─────────────────────────────────────────────────
export function calcBudgetProgress(byCategory, budgets, totalIncome) {
  return budgets.map(b => {
    const spent      = byCategory[b.category] ?? 0
    const pct        = b.budget_amount > 0 ? Math.min(spent / b.budget_amount * 100, 100) : 0
    const incomePct  = totalIncome > 0 ? +(spent / totalIncome * 100).toFixed(1) : 0
    const remaining  = b.budget_amount - spent
    const isOver     = spent > b.budget_amount
    return { ...b, spent, pct, incomePct, remaining, isOver }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount ?? 0)
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short'
  })
}

export const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export const getMonthName = (m) => MONTH_NAMES[m - 1] ?? ''

// ─── Datos para chart de últimos 6 meses ─────────────────────────────────────
export function calcLast6Months(transactions) {
  const now  = new Date()
  const data = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const s = calcMonthlyStats(transactions, m, y)
    data.push({ name: MONTH_NAMES[m - 1].slice(0, 3), income: s.income, expenses: s.expenses, balance: s.balance })
  }
  return data
}
