import React, { useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, Target, Plus, Flame
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts'
import { useApp } from '../../context/AppContext'
import {
  calcMonthlyStats, calcBudgetProgress, calcLast6Months,
  getCategoryInfo, getMonthName
} from '../../utils/calculations'
import MovementForm from '../Movements/MovementForm'

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`rounded-xl p-3 shadow-lg border text-xs ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }) {
  const accents = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    green:  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-800',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accents[accent]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { transactions, monthBudgets, monthGoal, currentMonth, currentYear, darkMode, fmt, allCategories } = useApp()
  const [showForm, setShowForm] = useState(false)

  const stats    = calcMonthlyStats(transactions, currentMonth, currentYear)
  const progress = calcBudgetProgress(stats.byCategory, monthBudgets, stats.income)
  const last6    = calcLast6Months(transactions)

  // Pie data
  const pieData = Object.entries(stats.byCategory)
    .map(([id, value]) => ({ ...getCategoryInfo(id, allCategories), value }))
    .sort((a, b) => b.value - a.value)

  // Savings goal progress
  const savingsGoal  = monthGoal?.savings_goal ?? 0
  const savingsPct   = savingsGoal > 0 ? Math.min(stats.balance / savingsGoal * 100, 100) : 0

  const tooltipStyle = {
    contentStyle: {
      background: darkMode ? '#1e293b' : '#fff',
      border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: 12, fontSize: 12,
      color: darkMode ? '#f1f5f9' : '#1e293b'
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto animate-fade-in pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{getMonthName(currentMonth)} {currentYear}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 text-sm"
        >
          <Plus size={16} />
          <span>Agregar</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Balance"
          value={fmt(stats.balance)}
          sub={`Tasa ahorro: ${stats.savingsRate}%`}
          icon={Wallet}
          accent={stats.balance >= 0 ? 'indigo' : 'red'}
        />
        <StatCard
          label="Ingresos"
          value={fmt(stats.income)}
          sub="Este mes"
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          label="Gastos"
          value={fmt(stats.expenses)}
          sub={stats.income > 0 ? `${((stats.expenses/stats.income)*100).toFixed(0)}% del ingreso` : 'Este mes'}
          icon={TrendingDown}
          accent="red"
        />
        <StatCard
          label="Meta Ahorro"
          value={savingsGoal > 0 ? `${savingsPct.toFixed(0)}%` : '—'}
          sub={savingsGoal > 0 ? `de ${fmt(savingsGoal)}` : 'Sin meta configurada'}
          icon={Target}
          accent="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Area chart — últimos 6 meses */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Tendencia — Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={last6}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="name" tick={{ fill: darkMode ? '#94a3b8' : '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={v => [fmt(v), '']} />
              <Area type="monotone" dataKey="income"   name="Ingresos" stroke="#22c55e" fill="url(#gIncome)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expenses" name="Gastos"   stroke="#ef4444" fill="url(#gExp)"    strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — gastos por categoría */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Gastos por Categoría</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={v => [fmt(v), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              Sin gastos registrados
            </div>
          )}
        </div>
      </div>

      {/* Budget progress */}
      {progress.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-orange-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Presupuestos — BI Inteligente</h3>
          </div>
          <div className="space-y-3">
            {progress.map(b => {
              const cat = getCategoryInfo(b.category, allCategories)
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${b.isOver ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {fmt(b.spent)} / {fmt(b.budget_amount)}
                      </span>
                      {stats.income > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
                          · {b.incomePct}% del ingreso
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        b.isOver ? 'bg-red-500' : b.pct > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  {b.isOver && (
                    <p className="text-xs text-red-500 mt-0.5">
                      Superado por {fmt(Math.abs(b.remaining))}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-4">Últimos Movimientos</h3>
        {stats.transactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {stats.transactions.slice(0, 6).map(tx => {
              const cat = getCategoryInfo(tx.category, allCategories)
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: cat.color + '22', color: cat.color }}
                    >
                      {cat.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">{cat.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{tx.description || tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <Wallet size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay movimientos este mes</p>
            <p className="text-xs mt-1">Usa el botón "Agregar" para registrar tu primer movimiento</p>
          </div>
        )}
      </div>

      {showForm && <MovementForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
