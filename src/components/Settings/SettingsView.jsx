import React, { useState } from 'react'
import { Save, Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { CURRENCIES } from '../../utils/calculations'

const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#3b82f6','#64748b']
const EMOJIS  = ['🍽️','🏠','🚗','💳','💪','📦','🎮','✈️','💊','🎓','🛍️','📱','⚡','🏥','🐾','🎁','💇','🍺']

export default function SettingsView() {
  const {
    userProfile, saveProfile,
    customCategories, addCustomCategory, updateCustomCategory, deleteCustomCategory,
    isDemoMode,
  } = useApp()

  // ── Profile state ────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(userProfile?.display_name ?? '')
  const [currency,    setCurrency]    = useState(userProfile?.currency ?? 'ARS')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved,  setProfileSaved]  = useState(false)

  async function handleSaveProfile() {
    setSavingProfile(true)
    await saveProfile({ currency, display_name: displayName })
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  // ── New category form ────────────────────────────────────────────
  const [newName,  setNewName]  = useState('')
  const [newEmoji, setNewEmoji] = useState('📌')
  const [newColor, setNewColor] = useState('#6366f1')
  const [addingCat, setAddingCat] = useState(false)
  const [catError,  setCatError]  = useState('')

  async function handleAddCategory() {
    if (!newName.trim()) { setCatError('Escribe un nombre para la categoría.'); return }
    setAddingCat(true); setCatError('')
    try {
      await addCustomCategory({ name: newName.trim(), emoji: newEmoji, color: newColor })
      setNewName(''); setNewEmoji('📌'); setNewColor('#6366f1')
    } catch { setCatError('Error al guardar.') }
    finally { setAddingCat(false) }
  }

  // ── Inline edit ─────────────────────────────────────────────────
  const [editId,    setEditId]    = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editColor, setEditColor] = useState('')

  function startEdit(cat) {
    setEditId(cat.id); setEditName(cat.name); setEditEmoji(cat.emoji); setEditColor(cat.color ?? '#6366f1')
  }
  async function confirmEdit(id) {
    await updateCustomCategory(id, { name: editName, emoji: editEmoji, color: editColor })
    setEditId(null)
  }

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto pb-8 animate-fade-in">

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h1>
        {isDemoMode && (
          <p className="text-xs text-amber-500 bg-amber-500/10 rounded-xl px-3 py-1.5 mt-2 inline-block">
            ⚡ Modo Demo — los cambios se guardan en el navegador
          </p>
        )}
      </div>

      {/* ── Perfil ───────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Perfil</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Nombre de usuario
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={60}
            className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Moneda predeterminada
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCurrency(c.id)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-center ${
                  currency === c.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="block font-bold">{c.symbol}</span>
                <span className="text-xs opacity-80">{c.id}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {CURRENCIES.find(c => c.id === currency)?.label}
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20"
        >
          {savingProfile
            ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
            : profileSaved
            ? <><Check size={15} /> ¡Guardado!</>
            : <><Save size={15} /> Guardar perfil</>}
        </button>
      </section>

      {/* ── Categorías personalizadas ─────────────────────────────── */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Categorías personalizadas</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Se suman a las categorías predeterminadas en formularios y presupuestos.
        </p>

        {/* Lista de categorías existentes */}
        {customCategories.length > 0 && (
          <div className="space-y-2">
            {customCategories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                {editId === cat.id ? (
                  <>
                    <select value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
                      className="text-lg bg-transparent border-0 focus:outline-none cursor-pointer">
                      {EMOJIS.map(em => <option key={em}>{em}</option>)}
                    </select>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-1">
                      {PALETTE.map(c => (
                        <button key={c} onClick={() => setEditColor(c)}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${editColor === c ? 'border-slate-800 dark:border-white scale-125' : 'border-transparent'}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <button onClick={() => confirmEdit(cat.id)} className="p-1 text-green-500 hover:text-green-400"><Check size={16}/></button>
                    <button onClick={() => setEditId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={16}/></button>
                  </>
                ) : (
                  <>
                    <span className="text-xl w-8 text-center">{cat.emoji}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color ?? '#6366f1' }} />
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Edit2 size={14}/>
                    </button>
                    <button onClick={() => deleteCustomCategory(cat.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulario nueva categoría */}
        <div className="border border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nueva categoría</p>

          <div className="flex gap-2">
            {/* Emoji selector */}
            <select
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              className="text-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {EMOJIS.map(em => <option key={em}>{em}</option>)}
            </select>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ej: Mascotas, Streaming..."
              maxLength={40}
              className="flex-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Color:</span>
            {PALETTE.map(c => (
              <button
                key={c} onClick={() => setNewColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${newColor === c ? 'border-slate-800 dark:border-white scale-125' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>

          {catError && <p className="text-red-500 text-xs">{catError}</p>}

          <button
            onClick={handleAddCategory}
            disabled={addingCat}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {addingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Agregar categoría
          </button>
        </div>
      </section>
    </div>
  )
}
