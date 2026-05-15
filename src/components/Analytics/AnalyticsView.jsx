import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { calcBudgetProgress, calcMonthlyStats, getMonthName } from '../../utils/calculations'
import { calcFinancialHealth, analyzeDiagnostic, analyzePredictive } from '../../utils/analyticsEngine'

// ─── Score gauge ─────────────────────────────────────────────────────────────
function ScoreGauge({ score, grade, color }) {
  const colors = { green: '#22c55e', blue: '#6366f1', amber: '#f59e0b', red: '#ef4444' }
  const hex = colors[color] ?? '#6366f1'
  const pct = score / 100
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:[stroke:#334155]"/>
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={hex} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="70" y="64" textAnchor="middle" fontSize="28" fontWeight="bold" fill={hex}>{score}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="11" fill="#94a3b8">/100</text>
      </svg>
      <span className="text-lg font-bold mt-1" style={{ color: hex }}>{grade}</span>
    </div>
  )
}

// ─── Insight badge ────────────────────────────────────────────────────────────
function Insight({ type, impact, message }) {
  const cfg = {
    positive: { icon: CheckCircle,   bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
    negative: { icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',     text: 'text-red-700 dark:text-red-300' },
    neutral:  { icon: Info,          bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800',   text: 'text-blue-700 dark:text-blue-300' },
  }
  const { bg, border, text, icon: Icon } = cfg[type] ?? cfg.neutral
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${bg} ${border}`}>
      <Icon size={16} className={`${text} mt-0.5 flex-shrink-0`} />
      <p className={`text-sm ${text}`}>{message}</p>
      {impact === 'alto' && (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded flex-shrink-0">
          alto
        </span>
      )}
    </div>
  )
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function AnalyticsView() {
  const { transactions, monthBudgets, currentMonth, currentYear, fmt, darkMode } = useApp()

  const stats    = calcMonthlyStats(transactions, currentMonth, currentYear)
  const progress = calcBudgetProgress(stats.byCategory, monthBudgets, stats.income)
  const health   = calcFinancialHealth(stats, progress)
  const diag     = useMemo(() => analyzeDiagnostic(transactions, currentMonth, currentYear), [transactions, currentMonth, currentYear])
  const pred     = useMemo(() => analyzePredictive(transactions, currentMonth, currentYear), [transactions, currentMonth, currentYear])

  const healthColors = { green: '#22c55e', blue: '#6366f1', amber: '#f59e0b', red: '#ef4444' }
  const barColor = (projected) => projected ? '#818cf8' : '#6366f1'

  const tooltipStyle = {
    contentStyle: {
      background: darkMode ? '#1e293b' : '#fff',
      border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: 10, fontSize: 12,
      color: darkMode ? '#f1f5f9' : '#1e293b',
    }
  }

  return (
    <div className="p-4 space-y-5 max-w-4xl mx-auto pb-8 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Análisis BI</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{getMonthName(currentMonth)} {currentYear}</p>
      </div>

      {/* ── 1. Salud financiera ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Salud Financiera</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreGauge score={health.score} grade={health.grade} color={health.color} />
          <div className="flex-1 space-y-3 w-full">
            {health.details.map(d => {
              const pct = (d.score / d.max) * 100
              const color = d.status === 'good' ? 'bg-green-500' : d.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{d.value} · {d.score}/{d.max} pts</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{d.hint}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Diagnóstico ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={16} className="text-orange-500" />
          <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Análisis Diagnóstico</h2>
          <span className="ml-auto text-xs text-slate-400">vs mes anterior</span>
        </div>

        {/* Insights */}
        {diag.insights.length > 0 ? (
          <div className="space-y-2 mb-4">
            {diag.insights.map((ins, i) => <Insight key={i} {...ins} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Sin cambios significativos respecto al mes anterior.</p>
        )}

        {/* Tabla comparativa por categoría */}
        {diag.comparison.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Comparativa por categoría</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500">
                    <th className="text-left pb-2">Categoría</th>
                    <th className="text-right pb-2">Mes anterior</th>
                    <th className="text-right pb-2">Este mes</th>
                    <th className="text-right pb-2">Cambio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {diag.comparison.map(({ cat, info, curr, prev, delta }) => (
                    <tr key={cat}>
                      <td className="py-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>{info.emoji}</span>{info.label}
                      </td>
                      <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">{fmt(prev)}</td>
                      <td className="py-1.5 text-right font-medium text-slate-800 dark:text-slate-200">{fmt(curr)}</td>
                      <td className={`py-1.5 text-right font-semibold ${
                        delta === null ? 'text-slate-400' :
                        delta > 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── 3. Predictivo ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Análisis Predictivo — Próximos {pred.daysRemaining} días</h2>
        </div>

        {/* Alerta si se proyecta balance negativo */}
        {pred.isNegativeRisk && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              ⚠️ Proyección: balance negativo al cierre del mes ({fmt(pred.projectedBalance)})
            </p>
          </div>
        )}

        {/* KPI proyectados */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Ingresos proyectados',  value: pred.projectedIncome,   color: 'text-green-600 dark:text-green-400' },
            { label: 'Gastos proyectados',     value: pred.projectedExpenses, color: 'text-red-500' },
            { label: 'Balance proyectado',     value: pred.projectedBalance,  color: pred.projectedBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p className={`text-base font-bold mt-0.5 ${color}`}>{fmt(value)}</p>
            </div>
          ))}
        </div>

        {/* Chart: últimos 3 meses + proyección */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={pred.chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v).replace(/[^0-9,.]/g, '').split(',')[0] + 'k'} />
            <Tooltip {...tooltipStyle} formatter={v => [fmt(v), '']} />
            <Bar dataKey="income"   name="Ingresos" radius={[4,4,0,0]}>
              {pred.chartData.map((e, i) => <Cell key={i} fill={e.projected ? '#86efac' : '#22c55e'} />)}
            </Bar>
            <Bar dataKey="expenses" name="Gastos"   radius={[4,4,0,0]}>
              {pred.chartData.map((e, i) => <Cell key={i} fill={e.projected ? '#fca5a5' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-1">★ = proyectado al ritmo actual del mes</p>

        {/* Categorías proyectadas */}
        {pred.categoryProjections.length > 0 && (
          <>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-4 mb-2">Proyección por categoría (promedio histórico)</h3>
            <div className="space-y-2">
              {pred.categoryProjections.slice(0, 5).map(({ cat, info, projected }) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">{info.emoji} {info.label}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{fmt(projected)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
