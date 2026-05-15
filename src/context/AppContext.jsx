import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { CATEGORIES, formatCurrency } from '../utils/calculations'

const AppContext = createContext(null)

// ─── Demo persistence ─────────────────────────────────────────────────────────
const STORE_KEY = 'fpbi-data-v1'
function loadDemo()  { try { return JSON.parse(localStorage.getItem(STORE_KEY)) ?? {} } catch { return {} } }
function saveDemo(d) { localStorage.setItem(STORE_KEY, JSON.stringify(d)) }

const DEFAULT_PROFILE = { currency: 'ARS', display_name: '' }

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const now = new Date()
  const [user,             setUser]             = useState(null)
  const [transactions,     setTransactions]     = useState([])
  const [goals,            setGoals]            = useState([])
  const [budgets,          setBudgets]          = useState([])
  const [userProfile,      setUserProfile]      = useState(DEFAULT_PROFILE)
  const [customCategories, setCustomCategories] = useState([])
  const [loading,          setLoading]          = useState(true)
  const [darkMode,         setDarkModeRaw]      = useState(() => localStorage.getItem('fpbi-dark') === 'true')
  const [currentMonth,     setCurrentMonth]     = useState(now.getMonth() + 1)
  const [currentYear,      setCurrentYear]      = useState(now.getFullYear())

  const setDarkMode = useCallback((v) => {
    setDarkModeRaw(v)
    localStorage.setItem('fpbi-dark', v)
    document.documentElement.classList.toggle('dark', v)
  }, [])

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [])

  // ─── Auth init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      const d = loadDemo()
      setUser({ id: 'demo', email: 'demo@finanzaspro.com', name: 'Demo User' })
      setTransactions(d.transactions ?? [])
      setGoals(d.goals ?? [])
      setBudgets(d.budgets ?? [])
      setUserProfile(d.profile ?? DEFAULT_PROFILE)
      setCustomCategories(d.customCategories ?? [])
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setTransactions([]); setGoals([]); setBudgets([])
        setUserProfile(DEFAULT_PROFILE); setCustomCategories([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ─── Fetch all data (Supabase) ────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (isDemoMode || !user) return
    const [txRes, goalRes, profileRes, catRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('monthly_goals').select('*, category_budgets(*)').eq('user_id', user.id),
      supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('custom_categories').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    if (txRes.data)      setTransactions(txRes.data)
    if (goalRes.data)    { setGoals(goalRes.data); setBudgets(goalRes.data.flatMap(g => g.category_budgets ?? [])) }
    if (profileRes.data) setUserProfile({ ...DEFAULT_PROFILE, ...profileRes.data })
    if (catRes.data)     setCustomCategories(catRes.data)
  }, [user])

  useEffect(() => { if (user && !isDemoMode) fetchAll() }, [user])

  // ─── Transactions CRUD ────────────────────────────────────────────────────
  const addTransaction = useCallback(async (tx) => {
    if (isDemoMode) {
      const item = { ...tx, id: `${Date.now()}`, created_at: new Date().toISOString() }
      setTransactions(prev => { const u = [item, ...prev]; saveDemo({ ...loadDemo(), transactions: u }); return u })
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
      setTransactions(prev => { const u = prev.filter(t => t.id !== id); saveDemo({ ...loadDemo(), transactions: u }); return u })
      return
    }
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [user])

  // ─── Goals CRUD ───────────────────────────────────────────────────────────
  const saveGoal = useCallback(async (month, year, savingsGoal, categoryBudgets) => {
    if (isDemoMode) {
      const gId = `goal-${month}-${year}`
      const ng  = { id: gId, month, year, savings_goal: savingsGoal }
      const nb  = categoryBudgets.map((b, i) => ({ ...b, id: `${gId}-${i}`, monthly_goal_id: gId, user_id: 'demo' }))
      setGoals(prev  => { const f = prev.filter(g => !(g.month === month && g.year === year)); const u = [...f, ng]; saveDemo({ ...loadDemo(), goals: u }); return u })
      setBudgets(prev => { const f = prev.filter(b => b.monthly_goal_id !== gId); const u = [...f, ...nb]; saveDemo({ ...loadDemo(), budgets: u }); return u })
      return
    }
    const { data: gData, error } = await supabase
      .from('monthly_goals')
      .upsert({ user_id: user.id, month, year, savings_goal: savingsGoal }, { onConflict: 'user_id,month,year' })
      .select().single()
    if (error) throw error
    await supabase.from('category_budgets').delete().eq('monthly_goal_id', gData.id)
    if (categoryBudgets.length)
      await supabase.from('category_budgets').insert(categoryBudgets.map(b => ({ ...b, monthly_goal_id: gData.id, user_id: user.id })))
    await fetchAll()
  }, [user, fetchAll])

  // ─── Profile CRUD ─────────────────────────────────────────────────────────
  const saveProfile = useCallback(async (updates) => {
    const merged = { ...userProfile, ...updates }
    setUserProfile(merged)
    if (isDemoMode) { saveDemo({ ...loadDemo(), profile: merged }); return }
    await supabase.from('user_profiles').upsert({ id: user.id, ...merged }, { onConflict: 'id' })
  }, [user, userProfile])

  // ─── Custom categories CRUD ───────────────────────────────────────────────
  const addCustomCategory = useCallback(async (cat) => {
    if (isDemoMode) {
      const item = { ...cat, id: `custom-${Date.now()}`, user_id: 'demo', sort_order: customCategories.length }
      setCustomCategories(prev => { const u = [...prev, item]; saveDemo({ ...loadDemo(), customCategories: u }); return u })
      return
    }
    const { data, error } = await supabase
      .from('custom_categories')
      .insert({ ...cat, user_id: user.id, sort_order: customCategories.length })
      .select().single()
    if (error) throw error
    setCustomCategories(prev => [...prev, data])
  }, [user, customCategories])

  const updateCustomCategory = useCallback(async (id, updates) => {
    setCustomCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    if (isDemoMode) { saveDemo({ ...loadDemo(), customCategories: customCategories.map(c => c.id === id ? { ...c, ...updates } : c) }); return }
    await supabase.from('custom_categories').update(updates).eq('id', id).eq('user_id', user.id)
  }, [user, customCategories])

  const deleteCustomCategory = useCallback(async (id) => {
    setCustomCategories(prev => { const u = prev.filter(c => c.id !== id); saveDemo({ ...loadDemo(), customCategories: u }); return u })
    if (!isDemoMode) await supabase.from('custom_categories').delete().eq('id', id).eq('user_id', user.id)
  }, [user])

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const signIn  = useCallback(async (email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error }, [])
  const signUp  = useCallback(async (email, password) => { const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error }, [])
  const signOut = useCallback(async () => { if (isDemoMode) { setUser(null); return } await supabase.auth.signOut() }, [])

  // ─── Computed ─────────────────────────────────────────────────────────────
  const allCategories = useMemo(() => [
    ...CATEGORIES,
    ...customCategories.map(c => ({
      id: c.id,
      label: c.name,
      color: c.color ?? '#6366f1',
      emoji: c.emoji ?? '📌',
      isCustom: true,
    }))
  ], [customCategories])

  const allExpenseCategories = useMemo(() =>
    allCategories.filter(c => c.id !== 'ingreso'),
    [allCategories]
  )

  const monthBudgets = budgets.filter(b => {
    const g = goals.find(g => g.id === b.monthly_goal_id)
    return g && g.month === currentMonth && g.year === currentYear
  })

  const monthGoal = goals.find(g => g.month === currentMonth && g.year === currentYear) ?? null

  const currency = userProfile?.currency ?? 'ARS'

  // Función de formateo con la moneda del usuario
  const fmt = useCallback((amount) => formatCurrency(amount, currency), [currency])

  return (
    <AppContext.Provider value={{
      user, transactions, goals, budgets, monthBudgets, monthGoal,
      userProfile, customCategories, allCategories, allExpenseCategories,
      currency, fmt,
      loading, darkMode, currentMonth, currentYear, isDemoMode,
      setDarkMode, setCurrentMonth, setCurrentYear,
      addTransaction, deleteTransaction, saveGoal,
      saveProfile, addCustomCategory, updateCustomCategory, deleteCustomCategory,
      signIn, signUp, signOut, refetch: fetchAll,
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
