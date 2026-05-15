import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Sparkles, RotateCcw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { calcMonthlyStats, getMonthName } from '../../utils/calculations'
import { generateAIResponse } from '../../utils/aiEngine'

const QUICK_PROMPTS = [
  '¿Cómo está mi ahorro?',
  'Analiza mis gastos',
  'Dame recomendaciones',
  '¿Cómo estoy vs presupuesto?',
  'Explícame la regla 50/30/20',
  '¿Cuánto necesito de fondo de emergencia?',
]

function Message({ msg }) {
  const isAI = msg.role === 'ai'
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        {isAI ? <Bot size={16} className="text-white" /> : <User size={16} className="text-slate-500 dark:text-slate-400" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isAI ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
             : 'bg-indigo-600 text-white'
      }`}>
        {isAI ? <MarkdownText text={msg.text} /> : <p>{msg.text}</p>}
        <p className={`text-[10px] mt-1.5 ${isAI ? 'text-slate-400' : 'text-indigo-200'}`}>{msg.time}</p>
      </div>
    </div>
  )
}

function MarkdownText({ text }) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('## '))  return <h3 key={i} className="font-bold text-base text-slate-900 dark:text-white mt-2 first:mt-0">{line.slice(3)}</h3>
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm text-slate-800 dark:text-slate-200 mt-1">{line.slice(4)}</h4>
        if (line.startsWith('---'))  return <hr key={i} className="border-slate-200 dark:border-slate-600 my-1" />
        if (line.startsWith('• ') || line.startsWith('- ')) return (
          <p key={i} className="flex gap-1.5"><span className="text-indigo-500 flex-shrink-0">•</span><span>{renderInline(line.slice(2))}</span></p>
        )
        if (line.startsWith('| ')) return <TableRow key={i} row={line} />
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

function TableRow({ row }) {
  if (row.includes('---|')) return null
  const cells = row.split('|').filter(c => c.trim())
  return (
    <div className="flex gap-2 text-xs border-b border-slate-100 dark:border-slate-700 pb-1">
      {cells.map((c, i) => (
        <span key={i} className={`flex-1 ${i === 0 ? 'text-slate-500 dark:text-slate-400' : 'font-semibold text-slate-800 dark:text-slate-200 text-right'}`}>
          {renderInline(c.trim())}
        </span>
      ))}
    </div>
  )
}

function renderInline(text) {
  return text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-900 dark:text-white">{p.slice(2,-2)}</strong>
      : p
  )
}

export default function ChatAgent() {
  const { transactions, monthBudgets, currentMonth, currentYear, fmt } = useApp()
  const stats = calcMonthlyStats(transactions, currentMonth, currentYear)

  const makeWelcome = () => ({
    role: 'ai',
    text: `¡Hola! Soy tu **Agente Financiero IA** 🤖\n\nAnalizo tus datos de ${getMonthName(currentMonth)} ${currentYear} en tiempo real.\n\n**Ingresos:** ${fmt(stats.income)} · **Gastos:** ${fmt(stats.expenses)} · **Ahorro:** ${stats.savingsRate}%\n\n¿Qué quieres saber?`,
    time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  })

  const [messages, setMessages] = useState([makeWelcome()])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const now = () => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  async function send(text) {
    const query = (text ?? input).trim()
    if (!query || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: query, time: now() }])
    setLoading(true)
    await new Promise(r => setTimeout(r, 150 + Math.random() * 250))
    const response = generateAIResponse(query, stats, monthBudgets)
    setMessages(prev => [...prev, { role: 'ai', text: response, time: now() }])
    setLoading(false)
    inputRef.current?.focus()
  }

  function reset() {
    setMessages([{ ...makeWelcome(), text: `Conversación reiniciada.\n\n**Ingresos:** ${fmt(stats.income)} · **Gastos:** ${fmt(stats.expenses)} · **Ahorro:** ${stats.savingsRate}%\n\n¿En qué te ayudo?` }])
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Agente Financiero IA</p>
            <p className="text-xs text-green-500">En línea · Analizando {getMonthName(currentMonth)}</p>
          </div>
        </div>
        <button onClick={reset} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(p)}
            className="flex-shrink-0 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 pb-safe">
        <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              placeholder="Escribe tu pregunta financiera..."
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
            <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" />
          </div>
          <button type="submit" disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
