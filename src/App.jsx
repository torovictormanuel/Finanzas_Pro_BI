import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import AuthForm      from './components/Auth/AuthForm'
import AppLayout     from './components/Layout/AppLayout'
import Dashboard     from './components/Dashboard'
import MovementsView from './components/Movements/MovementsView'
import CalendarView  from './components/Calendar/CalendarView'
import GoalsManager  from './components/Goals/GoalsManager'
import AnalyticsView from './components/Analytics/AnalyticsView'
import ChatAgent     from './components/AIAgent/ChatAgent'
import SettingsView  from './components/Settings/SettingsView'

function AppContent() {
  const { user, loading } = useApp()
  const [activePage, setActivePage] = useState('dashboard')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Cargando Finanzas Pro-BI...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthForm />

  const PAGES = {
    dashboard: <Dashboard />,
    movements: <MovementsView />,
    calendar:  <CalendarView />,
    goals:     <GoalsManager />,
    analytics: <AnalyticsView />,
    agent:     <ChatAgent />,
    settings:  <SettingsView />,
  }

  return (
    <AppLayout activePage={activePage} setActivePage={setActivePage}>
      {PAGES[activePage] ?? <Dashboard />}
    </AppLayout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      
    </AppProvider>
  )
}
