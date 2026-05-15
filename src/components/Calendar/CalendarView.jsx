import React, { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { calcDailyStats, getCategoryInfo, getMonthName } from '../../utils/calculations'
import MovementForm from '../Movements/MovementForm'

function getDaysInMonth(year, month)  { return new Date(year, month, 0).getDate() }
function getFirstDayOfWeek(year, month) { return new Date(year, month - 1, 1).getDay() }

export default function CalendarView() {
  const { transactions, currentMonth, currentYear, fmt, allCategories } = useApp()
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm,    setShowForm]    = useState(false)

  const daysInMonth    = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth)
  const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  function getDateStr(day) {
    return `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }
  function getDayStats(day) { return calcDailyStats(transactions, getDateStr(day)) }

  const selectedStats = selectedDay ? getDayStats(selectedDay) : null
  const today = new Date()
  const isToday = (d) => d === today.getDate() && currentMonth === today.getMonth()+1 && currentYear === today.getFullYear()

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto animate-fade-in pb-24 lg:pb-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Calendario — {getMonthName(currentMonth)} {currentYear}
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e${i}`} className="min-h-[56px] border-b border-r border-slate-100 dark:border-slate-700/50" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const stats      = getDayStats(day)
            const isSelected = selectedDay === day
            const todayDay   = isToday(day)
            return (
              <button key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-[56px] p-1.5 border-b border-r border-slate-100 dark:border-slate-700/50 text-left transition-colors ${
                  isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  todayDay ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'
                }`}>{day}</span>
                <div className="space-y-0.5">
                  {stats.income   > 0 && <div className="text-[10px] font-medium text-green-600 dark:text-green-400 leading-tight truncate">+{fmt(stats.income)}</div>}
                  {stats.expenses > 0 && <div className="text-[10px] font-medium text-red-500 dark:text-red-400 leading-tight truncate">−{fmt(stats.expenses)}</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1"><span className="text-green-500 font-bold">+</span> Ingresos</div>
        <div className="flex items-center gap-1"><span className="text-red-500 font-bold">−</span> Gastos</div>
      </div>

      {selectedDay && selectedStats && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">{selectedDay} de {getMonthName(currentMonth)}</h2>
              <p className="text-xs text-slate-400">
                {selectedStats.transactions.length} movimiento(s)
                {selectedStats.income   > 0 && ` · +${fmt(selectedStats.income)}`}
                {selectedStats.expenses > 0 && ` · −${fmt(selectedStats.expenses)}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(true)}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
                <Plus size={16} />
              </button>
              <button onClick={() => setSelectedDay(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {selectedStats.transactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {selectedStats.transactions.map(tx => {
                const cat = getCategoryInfo(tx.category, allCategories)
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: cat.color + '22' }}>
                        {cat.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.label}</p>
                        {tx.description && <p className="text-xs text-slate-400">{tx.description}</p>}
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
              Sin movimientos. Haz clic en + para agregar.
            </div>
          )}
        </div>
      )}

      {showForm && <MovementForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
