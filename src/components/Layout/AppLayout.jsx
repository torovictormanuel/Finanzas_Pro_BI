import React, { useState } from 'react'
import {
  LayoutDashboard, ListOrdered, CalendarDays, Target, Bot,
  BarChart2, Settings, Sun, Moon, LogOut, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getMonthName } from '../../utils/calculations'
import Logo from '../Logo'

// Desktop sidebar + mobile overlay: todos los items
const ALL_NAV = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'movements',  label: 'Movimientos',  icon: ListOrdered },
  { id: 'calendar',   label: 'Calendario',   icon: CalendarDays },
  { id: 'analytics',  label: 'Análisis BI',  icon: BarChart2 },
  { id: 'goals',      label: 'Objetivos',    icon: Target },
  { id: 'agent',      label: 'Agente IA',    icon: Bot },
  { id: 'settings',   label: 'Configuración',icon: Settings },
]

// Bottom nav mobile: los 5 más usados
const BOTTOM_NAV = [
  { id: 'dashboard',  label: 'Inicio',   icon: LayoutDashboard },
  { id: 'movements',  label: 'Gastos',   icon: ListOrdered },
  { id: 'analytics',  label: 'Análisis', icon: BarChart2 },
  { id: 'goals',      label: 'Metas',    icon: Target },
  { id: 'agent',      label: 'IA',       icon: Bot },
]

export default function AppLayout({ children, activePage, setActivePage }) {
  const { darkMode, setDarkMode, signOut, user, isDemoMode,
          currentMonth, currentYear, setCurrentMonth, setCurrentYear } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function prevMonth() {
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    if (currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth >= now.getMonth() + 1)) return
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }
  const isCurrentMonth = () => {
    const now = new Date()
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuario'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-700">
          <Logo size={34} color={darkMode ? '#818cf8' : '#6366f1'} />
          <div>
            <p className="font-bold text-sm leading-tight">Finanzas Pro-BI</p>
            <p className="text-xs text-slate-400 truncate max-w-[120px]">{displayName}</p>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {getMonthName(currentMonth)} {currentYear}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth()} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ALL_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePage === id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
          {isDemoMode && (
            <div className="text-xs text-amber-500 bg-amber-500/10 rounded-xl px-3 py-2 text-center mb-1">
              ⚡ Modo Demo
            </div>
          )}
          <button onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
          <button onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut size={18} />Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay sidebar ────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-white dark:bg-slate-800 h-full flex flex-col shadow-2xl z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Logo size={28} color={darkMode ? '#818cf8' : '#6366f1'} />
                <span className="font-bold">Finanzas Pro-BI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {ALL_NAV.map(({ id, label, icon: Icon }) => (
                <button key={id}
                  onClick={() => { setActivePage(id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    activePage === id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />{label}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
              <button onClick={() => { setDarkMode(!darkMode); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </button>
              <button onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                <LogOut size={18} />Cerrar Sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold">{getMonthName(currentMonth)} {currentYear}</span>
            <button onClick={nextMonth} disabled={isCurrentMonth()} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* ── Bottom Nav (mobile) ──────────────────────────────────── */}
        <nav className="lg:hidden flex bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe flex-shrink-0">
          {BOTTOM_NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActivePage(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                activePage === id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={20} className={activePage === id ? 'stroke-[2.5]' : ''} />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
