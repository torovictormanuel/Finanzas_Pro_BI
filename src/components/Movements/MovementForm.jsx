import React, { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { EXPENSE_CATEGORIES, CATEGORIES } from '../../utils/calculations'

export default function MovementForm({ onClose }) {
  const { addTransaction, currentMonth, currentYear } = useApp()
  const today = new Date()
  const defaultDate = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [type,        setType]        = useState('expense')
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState('comida')
  const [description, setDescription] = useState('')
  const [date,        setDate]        = useState(defaultDate)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!amount || isNaN(amount) || Number(amount) <= 0) { setError('Ingresa un monto válido.'); return }
    setLoading(true)
    try {
      await addTransaction({
        type,
        amount:      Number(amount),
        category:    type === 'income' ? 'ingreso' : category,
        description: description.trim(),
        date
      })
      onClose()
    } catch (err) {
      setError(err.message ?? 'Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  const cats = type === 'income'
    ? CATEGORIES.filter(c => c.id === 'ingreso')
    : EXPENSE_CATEGORIES

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nuevo Movimiento</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-4">

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {[{ v:'expense', l:'💸 Gasto' }, { v:'income', l:'💵 Ingreso' }].map(({ v, l }) => (
              <button
                key={v} type="button"
                onClick={() => { setType(v); setCategory(v === 'income' ? 'ingreso' : 'comida') }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  type === v
                    ? v === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-green-500 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >{l}</button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
              <input
                type="number"
                min="0.01" step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full text-2xl font-bold bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Categoría
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id} type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                      category === cat.id
                        ? 'border-transparent text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    style={category === cat.id ? { background: cat.color } : {}}
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Comentario <span className="normal-case font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Supermercado Día, Netflix..."
              maxLength={120}
              className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                     : <><Plus size={16} /> Guardar Movimiento</>}
          </button>
        </form>
      </div>
    </div>
  )
}
