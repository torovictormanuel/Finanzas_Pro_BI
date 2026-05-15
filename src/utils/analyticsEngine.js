import { calcMonthlyStats, getCategoryInfo, MONTH_NAMES } from './calculations'

// ─── Salud financiera (0-100) ─────────────────────────────────────────────────
export function calcFinancialHealth(stats, budgets) {
  let score = 0
  const details = []

  // Tasa de ahorro: hasta 40 pts (20%+ = máximo)
  const savingsScore = Math.min(40, (stats.savingsRate / 20) * 40)
  score += savingsScore
  details.push({
    label: 'Tasa de ahorro',
    score: Math.round(savingsScore),
    max: 40,
    status: stats.savingsRate >= 20 ? 'good' : stats.savingsRate >= 10 ? 'warning' : 'bad',
    value: `${stats.savingsRate.toFixed(1)}%`,
    hint: stats.savingsRate < 20 ? 'Meta recomendada: ≥ 20%' : '¡Excelente tasa de ahorro!',
  })

  // Presupuestos respetados: hasta 40 pts
  const total = budgets.length
  const overBudget = budgets.filter(b => b.isOver).length
  const budgetScore = total > 0 ? Math.max(0, 40 * (1 - overBudget / total)) : 20
  score += budgetScore
  details.push({
    label: 'Presupuestos respetados',
    score: Math.round(budgetScore),
    max: 40,
    status: overBudget === 0 ? 'good' : overBudget <= 1 ? 'warning' : 'bad',
    value: total > 0 ? `${total - overBudget} / ${total}` : 'Sin datos',
    hint: overBudget > 0 ? `${overBudget} categoría(s) excedida(s)` : 'Todos los presupuestos en orden',
  })

  // Balance positivo: 20 pts
  const balScore = stats.balance >= 0 ? 20 : 0
  score += balScore
  details.push({
    label: 'Balance positivo',
    score: balScore,
    max: 20,
    status: stats.balance >= 0 ? 'good' : 'bad',
    value: stats.balance >= 0 ? 'Sí ✓' : 'No ✗',
    hint: stats.balance < 0 ? 'Tus gastos superan tus ingresos este mes' : 'Cerrás el mes en positivo',
  })

  const final = Math.round(score)
  return {
    score: final,
    grade: final >= 80 ? 'Excelente' : final >= 60 ? 'Bueno' : final >= 40 ? 'Regular' : 'Crítico',
    color: final >= 80 ? 'green' : final >= 60 ? 'blue' : final >= 40 ? 'amber' : 'red',
    details,
  }
}

// ─── Diagnóstico: ¿por qué está el balance así? ──────────────────────────────
export function analyzeDiagnostic(transactions, currentMonth, currentYear) {
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear  = currentMonth === 1 ? currentYear - 1 : currentYear

  const curr = calcMonthlyStats(transactions, currentMonth, currentYear)
  const prev = calcMonthlyStats(transactions, prevMonth, prevYear)

  const insights = []

  if (curr.income === 0) {
    insights.push({ type: 'negative', impact: 'alto', message: 'No registraste ingresos este mes.' })
  } else if (prev.income > 0) {
    const delta = ((curr.income - prev.income) / prev.income) * 100
    if (Math.abs(delta) >= 5) {
      insights.push({
        type: delta > 0 ? 'positive' : 'negative',
        impact: Math.abs(delta) >= 20 ? 'alto' : 'medio',
        message: `Tus ingresos ${delta > 0 ? 'aumentaron' : 'disminuyeron'} un ${Math.abs(delta).toFixed(0)}% respecto al mes anterior.`,
      })
    }
  }

  const allCats = new Set([...Object.keys(curr.byCategory), ...Object.keys(prev.byCategory)])
  allCats.forEach(cat => {
    const c = curr.byCategory[cat] ?? 0
    const p = prev.byCategory[cat] ?? 0
    const info = getCategoryInfo(cat)
    if (p > 0 && c > 0) {
      const pct = ((c - p) / p) * 100
      if (pct >= 20) {
        insights.push({
          type: 'negative',
          impact: pct >= 50 ? 'alto' : 'medio',
          message: `${info.emoji} ${info.label} subió ${pct.toFixed(0)}% este mes (${p.toFixed(0)} → ${c.toFixed(0)}).`,
        })
      } else if (pct <= -20) {
        insights.push({
          type: 'positive',
          impact: 'medio',
          message: `${info.emoji} ${info.label} bajó ${Math.abs(pct).toFixed(0)}% — ¡buen trabajo!`,
        })
      }
    } else if (c > 0 && p === 0) {
      insights.push({
        type: 'neutral',
        impact: 'bajo',
        message: `${info.emoji} Nuevo gasto en ${info.label} este mes.`,
      })
    }
  })

  if (curr.balance < 0 && curr.expenses > 0) {
    const topEntry = Object.entries(curr.byCategory).sort((a, b) => b[1] - a[1])[0]
    if (topEntry) {
      const info = getCategoryInfo(topEntry[0])
      const pct = curr.income > 0 ? (topEntry[1] / curr.income * 100).toFixed(0) : '—'
      insights.push({
        type: 'negative',
        impact: 'alto',
        message: `Balance negativo: ${info.emoji} ${info.label} representa el ${pct}% de tus ingresos (tu categoría más cara).`,
      })
    }
  }

  const comparison = Object.keys({ ...curr.byCategory, ...prev.byCategory }).map(cat => {
    const info = getCategoryInfo(cat)
    const c = curr.byCategory[cat] ?? 0
    const p = prev.byCategory[cat] ?? 0
    const delta = p > 0 ? ((c - p) / p * 100) : null
    return { cat, info, curr: c, prev: p, delta }
  }).sort((a, b) => b.curr - a.curr)

  return { curr, prev, insights, comparison }
}

// ─── Predictivo: proyección 30 días ──────────────────────────────────────────
export function analyzePredictive(transactions, currentMonth, currentYear) {
  const pastMonths = []
  for (let i = 3; i >= 1; i--) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    pastMonths.push(calcMonthlyStats(transactions, m, y))
  }

  const valid = pastMonths.filter(m => m.income > 0 || m.expenses > 0)
  const count  = valid.length || 1
  const avgIncome   = valid.reduce((s, m) => s + m.income, 0) / count
  const avgExpenses = valid.reduce((s, m) => s + m.expenses, 0) / count

  const curr = calcMonthlyStats(transactions, currentMonth, currentYear)
  const today = new Date()
  const daysInMonth   = new Date(currentYear, currentMonth, 0).getDate()
  const daysPassed    = Math.min(today.getDate(), daysInMonth)
  const daysRemaining = daysInMonth - daysPassed

  const dailyExp = daysPassed > 0 ? curr.expenses / daysPassed : avgExpenses / daysInMonth
  const dailyInc = daysPassed > 0 ? curr.income   / daysPassed : avgIncome   / daysInMonth

  const projectedExpenses = curr.expenses + dailyExp * daysRemaining
  const projectedIncome   = curr.income   + dailyInc * daysRemaining
  const projectedBalance  = projectedIncome - projectedExpenses

  const catTotals = {}
  valid.forEach(m => {
    Object.entries(m.byCategory).forEach(([cat, amt]) => {
      catTotals[cat] = (catTotals[cat] ?? 0) + amt
    })
  })
  const categoryProjections = Object.entries(catTotals)
    .map(([cat, total]) => ({ cat, info: getCategoryInfo(cat), projected: total / count }))
    .sort((a, b) => b.projected - a.projected)

  // Chart: últimos 3 meses + proyección del mes actual
  const chartData = []
  for (let i = 3; i >= 1; i--) {
    let m = currentMonth - i; let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    const s = calcMonthlyStats(transactions, m, y)
    chartData.push({ name: MONTH_NAMES[m - 1].slice(0, 3), income: s.income, expenses: s.expenses, projected: false })
  }
  chartData.push({
    name: MONTH_NAMES[currentMonth - 1].slice(0, 3) + '★',
    income: projectedIncome,
    expenses: projectedExpenses,
    projected: true,
  })

  return {
    avgIncome, avgExpenses,
    projectedIncome, projectedExpenses, projectedBalance,
    isNegativeRisk: projectedBalance < 0,
    categoryProjections,
    chartData,
    daysRemaining,
    daysPassed,
    daysInMonth,
  }
}
