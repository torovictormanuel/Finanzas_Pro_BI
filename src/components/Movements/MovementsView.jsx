import React, { useState } from 'react'
import { Plus, Trash2, Search, Filter } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { calcMonthlyStats, formatCurrency, getCategoryInfo, formatDate } from '../../utils/calculations'
import MovementForm from './MovementForm'

export default function MovementsView() {
  const { transactions, deleteTransaction, currentMonth, currentYear } = useApp()
  const [showForm,  setShowForm]  = useState(false)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')   // all | income | expense
  const [deleting,  setDeleting]  = useState(null)

  const stats = calcMonthlyStats(transactions, currentMonth, currentYear)

  const filtered = stats.transactions.filter(tx => {
    const matchType   = filter === 'all' || tx.type === filter
    const matchSearch = !search || [tx.category, tx.description ?? ''].some(s =>
      s.toLowerCase().includes(search.toLowerCase())
    )
    return matchType && matchSearch
  })

  // Group by date
  const groups = filtered.reduce((acc, tx) => {
    const d = tx.date
    ;(acc[d] = acc[d] ?? []).push(tx)
    return acc
  }, {})
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  async function handleDelete(id) {
    setDeleting(id)
    try { await deleteTransaction(id) } finally { setDeleting(null) }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto animate-fade-in pb-24 lg:pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Movimientos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2">
        {[
          { label: 'Ingresos', value: stats.income, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Gastos',   value: stats.expenses, color: 'text-red-600 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Balance',  value: stats.balance,  color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map(p => (
          <div key={p.label} className={`flex-1 ${p.bg} rounded-xl p-2.5 text-center`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.label}</p>
            <p className={`text-sm font-bold ${p.color}`}>{formatCurrency(p.value)}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar categoría o comentario..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
      </div>

      {/* Transaction list grouped by date */}
      {sortedDates.length > 0 ? (
        sortedDates.map(date => {
          const dayTxs    = groups[date]
          const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
          const dayExp    = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {formatDate(date)}
                </p>
                <div className="flex gap-2 text-xs">
                  {dayIncome > 0 && <span className="text-green-500">+{formatCurrency(dayIncome)}</span>}
                  {dayExp    > 0 && <span className="text-red-500">−{formatCurrency(dayExp)}</span>}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {dayTxs.map(tx => {
                  const cat = getCategoryInfo(tx.category)
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3 group">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: cat.color + '22' }}
                        >
                          {cat.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cat.label}</p>
                          {tx.description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{tx.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                        </span>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deleting === tx.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      ) : (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">Sin movimientos</p>
          <p className="text-sm mt-1">
            {search ? 'No hay resultados para tu búsqueda.' : 'Agrega tu primer movimiento.'}
          </p>
        </div>
      )}

      {showForm && <MovementForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
