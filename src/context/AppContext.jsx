import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'

const AppContext = createContext(null)

// ─── Demo persistence ─────────────────────────────────────────────────────────
const STORE_KEY = 'fpbi-data-v1'
function loadDemo()  { try { return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {} } catch { return {} } }
function saveDemo(d) { localStorage.setItem(STORE_KEY, JSON.stringify(d)) }

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const now = new Date()
  const [user,         setUser]         = useState(null)
  const [transactions, setTransactions] = useState([])
  const [goals,        setGoals]        = useState([])
  const [budgets,      setBudgets]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [darkMode,     setDarkModeRaw]  = useState(() => localStorage.getItem('fpbi-dark') === 'true')
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1)
  const [currentYear,  setCurrentYear]  = useState(now.getFullYear())

  // Dark mode side-effect
  const setDarkMode = useCallback((v) => {
    setDarkModeRaw(v)
    localStorage.setItem('fpbi-dark', v)
    document.documentElement.classList.toggle('dark', v)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [])

  // ─── Auth init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      const d = loadDemo()
      setUser({ id: 'demo', email: 'demo@finanzaspro.com', name: 'Demo User' })
      setTransactions(d.transactions ?? [])
      setGoals(d.goals ?? [])
      setBudgets(d.budgets ?? [])
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setTransactions([]); setGoals([]); setBudgets([]) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ─── Fetch data (Supabase mode) ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (isDemoMode || !user) return
    const [txRes, goalRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('monthly_goals').select('*, category_budgets(*)').eq('user_id', user.id)
    ])
    if (txRes.data)   setTransactions(txRes.data)
    if (goalRes.data) {
      setGoals(goalRes.data)
      setBudgets(goalRes.data.flatMap(g => g.category_budgets ?? []))
    }
  }, [user])

  useEffect(() => { if (user && !isDemoMode) fetchAll() }, [user])

  // ─── CRUD helpers ──────────────────────────────────────────────────────────
  const addTransaction = useCallback(async (tx) => {
    if (isDemoMode) {
      const item = { ...tx, id: `${Date.now()}`, created_at: new Date().toISOString() }
      setTransactions(prev => {
        const updated = [item, ...prev]
        saveDemo({ ...loadDemo(), transactions: updated })
        return updated
      })
      return item
    }
    const { data, error } = await supabase
      .from('transactions').insert({ ...tx, user_id: user.id }).select().single()
    if (error) throw error
    setTransactions(prev => [data, ...prev])
    return data
  }, [user])

  const deleteTransaction = useCallback(async (id) => {
    if (isDemoMode) {
      setTransactions(prev => {
        const updated = prev.filter(t => t.id !== id)
        saveDemo({ ...loadDemo(), transactions: updated })
        return updated
      })
      return
    }
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [user])

  const saveGoal = useCallback(async (month, year, savingsGoal, categoryBudgets) => {
    if (isDemoMode) {
      const gId      = `goal-${month}-${year}`
      const newGoal  = { id: gId, month, year, savings_goal: savingsGoal }
      const newBdg   = categoryBudgets.map((b, i) => ({ ...b, id: `${gId}-${i}`, monthly_goal_id: gId, user_id: 'demo' }))
      setGoals(prev  => { const f = prev.filter(g => !(g.month === month && g.year === year)); const u = [...f, newGoal]; saveDemo({ ...loadDemo(), goals: u }); return u })
      setBudgets(prev => { const f = prev.filter(b => b.monthly_goal_id !== gId); const u = [...f, ...newBdg]; saveDemo({ ...loadDemo(), budgets: u }); return u })
      return
    }
    const { data: gData, error } = await supabase
      .from('monthly_goals')
      .upsert({ user_id: user.id, month, year, savings_goal: savingsGoal }, { onConflict: 'user_id,month,year' })
      .select().single()
    if (error) throw error
    await supabase.from('category_budgets').delete().eq('monthly_goal_id', gData.id)
    if (categoryBudgets.length) {
      await supabase.from('category_budgets').insert(
        categoryBudgets.map(b => ({ ...b, monthly_goal_id: gData.id, user_id: user.id }))
      )
    }
    await fetchAll()
  }, [user, fetchAll])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (isDemoMode) { setUser(null); return }
    await supabase.auth.signOut()
  }, [])

  // ─── Month budgets helper ──────────────────────────────────────────────────
  const monthBudgets = budgets.filter(b => {
    const g = goals.find(g => g.id === b.monthly_goal_id)
    return g && g.month === currentMonth && g.year === currentYear
  })

  const monthGoal = goals.find(g => g.month === currentMonth && g.year === currentYear) ?? null

  return (
    <AppContext.Provider value={{
      user, transactions, goals, budgets, monthBudgets, monthGoal,
      loading, darkMode, currentMonth, currentYear, isDemoMode,
      setDarkMode, setCurrentMonth, setCurrentYear,
      addTransaction, deleteTransaction, saveGoal,
      signIn, signUp, signOut, refetch: fetchAll
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
