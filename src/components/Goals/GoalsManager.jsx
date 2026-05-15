import React, { useState, useEffect } from 'react'
import { Target, Save, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  calcMonthlyStats, calcBudgetProgress,
  formatCurrency, getCategoryInfo, getMonthName, EXPENSE_CATEGORIES
} from '../../utils/calculations'

export default function GoalsManager() {
  const { transactions, monthBudgets, monthGoal, currentMonth, currentYear, saveGoal } = useApp()

  const stats    = calcMonthlyStats(transactions, currentMonth, currentYear)
  const progress = calcBudgetProgress(stats.byCategory, monthBudgets, stats.income)

  // Form state
  const [savingsGoal, setSavingsGoal] = useState('')
  const [catBudgets,  setCatBudgets]  = useState(
    EXPENSE_CATEGORIES.reduce((acc, c) => ({ ...acc, [c.id]: '' }), {})
  )
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  // Populate form from existing goal
  useEffect(() => {
    if (monthGoal) setSavingsGoal(monthGoal.savings_goal?.toString() ?? '')
    const map = { ...catBudgets }
    monthBudgets.forEach(b => { map[b.category] = b.budget_amount?.toString() ?? '' })
    setCatBudgets(map)
  }, [monthGoal, monthBudgets])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const budgets = Object.entries(catBudgets)
        .filter(([, v]) => v && !isNaN(v) && Number(v) > 0)
        .map(([category, budget_amount]) => ({ category, budget_amount: Number(budget_amount) }))

      await saveGoal(currentMonth, currentYear, Number(savingsGoal) || 0, budgets)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message ?? 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto animate-fade-in pb-24 lg:pb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Target size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Objetivos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{getMonthName(currentMonth)} {currentYear}</p>
        </div>
      </div>

      {/* Progress overview */}
      {progress.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Estado Actual</h3>

          {/* Savings goal progress */}
          {monthGoal?.savings_goal > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  💰 Meta de Ahorro
                </span>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(stats.balance)} / {formatCurrency(monthGoal.savings_goal)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    stats.balance >= monthGoal.savings_goal ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(Math.max(stats.balance / monthGoal.savings_goal * 100, 0), 100)}%` }}
                />
              </div>
              {stats.balance >= monthGoal.savings_goal
                ? <p className="text-xs text-green-500 mt-0.5">✅ ¡Meta de ahorro alcanzada!</p>
                : <p className="text-xs text-slate-400 mt-0.5">Te faltan {formatCurrency(monthGoal.savings_goal - stats.balance)}</p>
              }
            </div>
          )}

          {/* Category budgets */}
          {progress.map(b => {
            const cat = getCategoryInfo(b.category)
            return (
              <div key={b.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>{cat.emoji}</span>{cat.label}
                  </span>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${b.isOver ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.budget_amount)}
                    </span>
                    {stats.income > 0 && (
                      <span className="text-xs text-slate-400 ml-2">({b.incomePct}% del ingreso)</span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      b.isOver ? 'bg-red-500' : b.pct > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                {b.isOver
                  ? <p className="text-xs text-red-500 mt-0.5">Superado en {formatCurrency(Math.abs(b.remaining))}</p>
                  : <p className="text-xs text-slate-400 mt-0.5">Disponible: {formatCurrency(b.remaining)}</p>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* Configuration form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 space-y-5">
        <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Configurar Metas</h3>

        {/* Savings goal */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            💰 Meta de Ahorro mensual
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">$</span>
            <input
              type="number" min="0" step="0.01"
              value={savingsGoal}
              onChange={e => setSavingsGoal(e.target.value)}
              placeholder="ej: 500.00"
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Se recomienda el 20% de tus ingresos
            {stats.income > 0 && ` (${formatCurrency(stats.income * 0.2)})`}.
          </p>
        </div>

        {/* Category budgets */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Presupuesto por Categoría
          </label>
          <div className="space-y-3">
            {EXPENSE_CATEGORIES.map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: cat.color + '22' }}>
                  {cat.emoji}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-24 flex-shrink-0">{cat.label}</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={catBudgets[cat.id] ?? ''}
                    onChange={e => setCatBudgets(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    placeholder="Sin límite"
                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {stats.byCategory[cat.id] > 0 && (
                  <span className="text-xs text-slate-400 flex-shrink-0 w-20 text-right">
                    Gastado: {formatCurrency(stats.byCategory[cat.id])}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {error  && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}
        {saved  && <p className="text-green-500 text-sm bg-green-50 dark:bg-green-500/10 rounded-xl px-3 py-2">✅ Metas guardadas correctamente.</p>}

        <button
          type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  : <><Save size={16} /> Guardar Objetivos</>}
        </button>
      </form>
    </div>
  )
}
