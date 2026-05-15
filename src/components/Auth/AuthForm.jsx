import React, { useState } from 'react'
import { TrendingUp, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function AuthForm() {
  const { signIn, signUp, isDemoMode } = useApp()
  const [mode,    setMode]    = useState('login')   // 'login' | 'register'
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!email || !pass) { setError('Completa todos los campos.'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, pass)
      } else {
        await signUp(email, pass)
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.')
      }
    } catch (err) {
      setError(err.message ?? 'Ocurrió un error. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Finanzas Pro-BI</h1>
          <p className="text-slate-400 mt-1">Control financiero inteligente</p>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 text-amber-300 text-sm text-center">
            ⚡ Modo Demo activo — datos guardados localmente.<br />
            Configura Supabase en <code className="text-xs">.env</code> para sincronización real.
          </div>
        )}

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {m === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Error / Success */}
            {error   && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"><AlertCircle size={14} />{error}</div>}
            {success && <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">✅ {success}</div>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                       : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          {/* Demo quick-start */}
          {isDemoMode && (
            <p className="text-center text-slate-500 text-xs mt-4">
              En modo Demo puedes ingresar con cualquier email/contraseña.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
