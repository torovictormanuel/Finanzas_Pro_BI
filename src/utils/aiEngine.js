// Motor de IA financiero — análisis basado en reglas + contexto real del usuario

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const THRESHOLDS = {
  comida: 25, alquiler: 35, transporte: 15, deudas: 20, gym: 5, varios: 15
}

// ─── Respuesta principal ──────────────────────────────────────────────────────
export function generateAIResponse(rawQuery, stats, budgets = []) {
  const q = rawQuery.toLowerCase().trim()

  if (!rawQuery) return helpMessage()

  if (/^(hola|buenas|hey|hi|saludos)/.test(q)) return welcomeMessage(stats)
  if (/ahorro|ahorrar|guardar/.test(q))          return analyzeSavings(stats)
  if (/resumen|balance|cómo estoy|summary/.test(q)) return generateSummary(stats, budgets)
  if (/consejo|recomien|qué hago|ayuda|estrategia/.test(q)) return generalAdvice(stats, budgets)
  if (/ingreso|sueldo|salario|ganancia/.test(q))  return analyzeIncome(stats)
  if (/gasto|gasté|gastar|spend/.test(q))         return analyzeExpenses(stats, budgets)
  if (/presupuesto|budget|meta|objetivo/.test(q)) return analyzeBudgets(stats, budgets)
  if (/comida|aliment|restaurant/.test(q))        return analyzeCategory(stats, budgets, 'comida')
  if (/alquiler|renta|vivienda/.test(q))          return analyzeCategory(stats, budgets, 'alquiler')
  if (/transporte|auto|nafta|colectivo/.test(q))  return analyzeCategory(stats, budgets, 'transporte')
  if (/deuda|préstamo|credito|tarjeta/.test(q))   return analyzeCategory(stats, budgets, 'deudas')
  if (/gym|ejercicio|sport/.test(q))              return analyzeCategory(stats, budgets, 'gym')
  if (/varios|miscel/.test(q))                    return analyzeCategory(stats, budgets, 'varios')
  if (/regla|50.30|porcentaje/.test(q))           return rule503020(stats)
  if (/fondo|emergencia/.test(q))                 return emergencyFund(stats)

  return generalAdvice(stats, budgets)
}

// ─── Módulos de análisis ──────────────────────────────────────────────────────
function welcomeMessage(stats) {
  const hasData = stats.income > 0 || stats.expenses > 0
  return `¡Hola! Soy tu **Agente Financiero IA** 🤖

Analizo tus datos en tiempo real y te doy consejos personalizados.
${hasData
  ? `Ya veo datos de este mes: **$${stats.income.toFixed(2)}** de ingresos y **$${stats.expenses.toFixed(2)}** en gastos.`
  : 'Aún no hay movimientos este mes. ¡Agrega tu primer ingreso!'}

Puedes preguntarme sobre:
• **Ahorro** → "¿Cómo está mi ahorro?"
• **Gastos** → "Analiza mis gastos"
• **Categorías** → "¿Cuánto gasté en comida?"
• **Consejos** → "Dame recomendaciones"
• **Reglas** → "Explícame la regla 50/30/20"
• **Emergencias** → "¿Tengo fondo de emergencia?"

¿Qué quieres saber?`
}

function helpMessage() {
  return `Escribe tu pregunta. Ejemplos:\n• "¿Cómo está mi ahorro?"\n• "Analiza mis gastos en comida"\n• "Dame consejos para este mes"\n• "¿Qué es la regla 50/30/20?"`
}

function analyzeSavings(stats) {
  if (!stats.income) return noIncomeMsg()

  const rate   = stats.savingsRate
  const saved  = stats.income - stats.expenses
  let response = `## 💰 Análisis de Ahorro\n\n`
  response += `| | Monto |\n|---|---|\n`
  response += `| Ingresos | **$${stats.income.toFixed(2)}** |\n`
  response += `| Gastos | **$${stats.expenses.toFixed(2)}** |\n`
  response += `| Ahorro neto | **$${saved.toFixed(2)}** |\n`
  response += `| Tasa de ahorro | **${rate}%** |\n\n`

  if (rate >= 30) {
    response += `🏆 **Excelente.** Tu tasa del ${rate}% supera el benchmark recomendado del 20%.\n\n💡 Considera invertir el excedente: fondos indexados o un plazo fijo para hacer trabajar tu dinero.`
  } else if (rate >= 20) {
    response += `✅ **Bien encaminado.** Cumples la meta básica del 20%.\n\n💡 Para subir al siguiente nivel, identifica el gasto variable más alto y reducelo un 10%.`
  } else if (rate >= 10) {
    response += `⚠️ **Por debajo del objetivo.** El 20% es el mínimo recomendado; tú estás en ${rate}%.\n\n💡 **Estrategia rápida:** transfiere automáticamente el 10% de tu sueldo apenas lo cobres (págate primero).`
  } else if (rate > 0) {
    response += `📉 **Tasa de ahorro muy baja (${rate}%).** Acción inmediata necesaria.\n\n💡 Aplica la regla del "pago automático al ahorro" y revisa gastos en Varios y Comida.`
  } else {
    response += `🚨 **Déficit mensual.** Estás gastando más de lo que ingresas.\n\n💡 **Paso 1:** Lista los 3 gastos más altos. **Paso 2:** Elimina o reduce el menos esencial. **Paso 3:** Busca ingresos adicionales.`
  }

  return response
}

function analyzeExpenses(stats, budgets) {
  if (stats.expenses === 0) return `📊 No hay gastos registrados este mes. Agrega movimientos para ver el análisis.`

  const sorted = Object.entries(stats.byCategory).sort(([, a], [, b]) => b - a)
  let response = `## 📊 Análisis de Gastos\n\n**Total:** $${stats.expenses.toFixed(2)}\n\n`
  response += `**Distribución:**\n`

  sorted.forEach(([cat, amount]) => {
    const pct      = stats.income > 0 ? ((amount / stats.income) * 100).toFixed(1) : '—'
    const threshold = THRESHOLDS[cat]
    const warn     = threshold && stats.income > 0 && parseFloat(pct) > threshold ? ' ⚠️' : ''
    response += `• **${cap(cat)}:** $${amount.toFixed(2)} (${pct}% del ingreso)${warn}\n`
  })

  if (stats.income > 0) {
    const [topCat, topAmt] = sorted[0]
    const topPct = ((topAmt / stats.income) * 100).toFixed(1)
    response += `\n📌 Tu mayor gasto es **${cap(topCat)}** con el ${topPct}% de tus ingresos.`
    if (parseFloat(topPct) > (THRESHOLDS[topCat] ?? 30)) {
      response += ` Está por encima del límite recomendado.`
    }
  }

  return response
}

function analyzeCategory(stats, budgets, category) {
  const spent  = stats.byCategory?.[category] ?? 0
  const budget = budgets.find(b => b.category === category)
  const emojis = { comida:'🍽️', alquiler:'🏠', transporte:'🚗', deudas:'💳', gym:'💪', varios:'📦' }
  const emoji  = emojis[category] ?? '📌'

  let response = `## ${emoji} ${cap(category)}\n\n`

  if (spent === 0) {
    response += `No registraste gastos en esta categoría este mes.`
    if (budget) response += `\n\n💡 Tienes un presupuesto de $${budget.budget_amount.toFixed(2)} sin usar.`
    return response
  }

  response += `**Gastado:** $${spent.toFixed(2)}\n`

  if (stats.income > 0) {
    const pct = ((spent / stats.income) * 100).toFixed(1)
    const limit = THRESHOLDS[category] ?? 20
    response += `**% del ingreso:** ${pct}% (límite sano: ${limit}%)\n`
    response += parseFloat(pct) > limit
      ? `\n⚠️ Superas el umbral recomendado del ${limit}%.`
      : `\n✅ Dentro del rango saludable.`
  }

  if (budget) {
    const rem  = budget.budget_amount - spent
    const pct  = Math.min(spent / budget.budget_amount * 100, 100).toFixed(0)
    response += `\n\n**Presupuesto:** $${budget.budget_amount.toFixed(2)}\n`
    response += `**Progreso:** ${pct}%\n`
    response += rem < 0
      ? `\n🚨 Superaste tu presupuesto por **$${Math.abs(rem).toFixed(2)}**.`
      : rem < budget.budget_amount * 0.15
      ? `\n⚠️ Te quedan solo **$${rem.toFixed(2)}** del presupuesto.`
      : `\n✅ Disponible: **$${rem.toFixed(2)}**.`
  }

  return response
}

function analyzeIncome(stats) {
  if (!stats.income) return noIncomeMsg()

  let response = `## 💵 Ingresos del Mes\n\n`
  response += `**Total ingresos:** $${stats.income.toFixed(2)}\n`
  response += `**Total gastos:** $${stats.expenses.toFixed(2)}\n`
  response += `**Saldo neto:** $${stats.balance.toFixed(2)}\n\n`
  response += `### Regla 50/30/20 aplicada\n`
  response += `• 🏠 **Necesidades (50%):** $${(stats.income * 0.5).toFixed(2)}\n`
  response += `• 🎯 **Deseos (30%):** $${(stats.income * 0.3).toFixed(2)}\n`
  response += `• 💰 **Ahorro/Inversión (20%):** $${(stats.income * 0.2).toFixed(2)}\n`

  return response
}

function analyzeBudgets(stats, budgets) {
  if (!budgets.length) return `No configuraste presupuestos para este mes.\n\n💡 Ve a la sección **Objetivos** para establecer límites por categoría.`

  let response = `## 🎯 Estado de Presupuestos\n\n`
  budgets.forEach(b => {
    const spent = stats.byCategory?.[b.category] ?? 0
    const pct   = b.budget_amount > 0 ? (spent / b.budget_amount * 100).toFixed(0) : 0
    const icon  = spent > b.budget_amount ? '🚨' : pct > 80 ? '⚠️' : '✅'
    response += `${icon} **${cap(b.category)}:** $${spent.toFixed(2)} / $${b.budget_amount.toFixed(2)} (${pct}%)\n`
  })

  const over = budgets.filter(b => (stats.byCategory?.[b.category] ?? 0) > b.budget_amount)
  if (over.length) {
    response += `\n⚠️ Superaste ${over.length} presupuesto(s): ${over.map(b => cap(b.category)).join(', ')}.`
  } else {
    response += `\n✅ Todos los presupuestos bajo control.`
  }

  return response
}

function generalAdvice(stats, budgets) {
  const insights = []

  if (!stats.income) { insights.push('📌 Registra tus ingresos para obtener análisis completo.') }
  else {
    const rate = stats.savingsRate
    if (rate < 0)   insights.push('🚨 **Déficit:** gastas más de lo que ingresas. Acción urgente.')
    else if (rate < 20) insights.push(`⚠️ Tasa de ahorro del ${rate}% — objetivo: ≥20%.`)
    else                insights.push(`✅ Ahorro del ${rate}%. Buen trabajo.`)

    Object.entries(stats.byCategory).forEach(([cat, amount]) => {
      const pct = (amount / stats.income) * 100
      if (THRESHOLDS[cat] && pct > THRESHOLDS[cat]) {
        insights.push(`⚠️ **${cap(cat)}** consume el ${pct.toFixed(0)}% de tus ingresos (límite: ${THRESHOLDS[cat]}%).`)
      }
    })
  }

  budgets.forEach(b => {
    const spent = stats.byCategory?.[b.category] ?? 0
    if (spent > b.budget_amount) {
      insights.push(`🚨 Presupuesto de **${cap(b.category)}** superado por $${(spent - b.budget_amount).toFixed(2)}.`)
    }
  })

  if (insights.length === 0) {
    insights.push('✅ Tus finanzas están equilibradas este mes.')
    insights.push('💡 Considera aumentar tu meta de ahorro o iniciar un fondo de inversión.')
  }

  return `## 🤖 Recomendaciones Personalizadas\n\n${insights.join('\n\n')}\n\n---\n💬 Pregúntame sobre una categoría o estrategia específica.`
}

function rule503020(stats) {
  let response = `## 📐 Regla 50/30/20\n\n`
  response += `Es una guía simple para distribuir tu ingreso neto:\n\n`
  response += `| Bloque | % | Uso | Ejemplos |\n|---|---|---|---|\n`
  response += `| 🏠 Necesidades | 50% | Gastos fijos e imprescindibles | Alquiler, comida, transporte, servicios |\n`
  response += `| 🎯 Deseos | 30% | Gastos opcionales que mejoran tu vida | Gym, salidas, suscripciones, ropa |\n`
  response += `| 💰 Ahorro | 20% | Construir patrimonio y seguridad | Fondo de emergencia, inversión, retiro |\n\n`

  if (stats.income > 0) {
    response += `**Aplicado a tus ingresos de $${stats.income.toFixed(2)}:**\n`
    response += `• Necesidades: $${(stats.income * 0.5).toFixed(2)}\n`
    response += `• Deseos: $${(stats.income * 0.3).toFixed(2)}\n`
    response += `• Ahorro: $${(stats.income * 0.2).toFixed(2)}\n`
  }

  return response
}

function emergencyFund(stats) {
  let response = `## 🛡️ Fondo de Emergencia\n\n`
  response += `Un fondo de emergencia cubre **3 a 6 meses de gastos** fijos sin depender de ingresos.\n\n`

  if (stats.expenses > 0) {
    const min = stats.expenses * 3
    const max = stats.expenses * 6
    response += `Basado en tus gastos mensuales de **$${stats.expenses.toFixed(2)}**:\n`
    response += `• **Mínimo recomendado (3 meses):** $${min.toFixed(2)}\n`
    response += `• **Óptimo (6 meses):** $${max.toFixed(2)}\n\n`
    response += `💡 Si aún no lo tienes, empieza con una meta de $${(stats.expenses * 1).toFixed(2)} (1 mes) y súbela gradualmente.`
  } else {
    response += `Registra tus gastos mensuales y te calcularé el monto exacto que necesitas.`
  }

  return response
}

function generateSummary(stats, budgets) {
  let response = `## 📋 Resumen del Mes\n\n`
  response += `| Concepto | Monto |\n|---|---|\n`
  response += `| 💵 Ingresos | $${stats.income.toFixed(2)} |\n`
  response += `| 💸 Gastos | $${stats.expenses.toFixed(2)} |\n`
  response += `| 💰 Balance | $${stats.balance.toFixed(2)} |\n`
  response += `| 📈 Tasa de ahorro | ${stats.savingsRate}% |\n`

  if (Object.keys(stats.byCategory).length) {
    response += `\n**Gastos por categoría:**\n`
    Object.entries(stats.byCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, amt]) => { response += `• ${cap(cat)}: $${amt.toFixed(2)}\n` })
  }

  return response
}

function noIncomeMsg() {
  return `📌 No registraste ingresos este mes. Agrega un movimiento de tipo **Ingreso** para que pueda analizar tu situación financiera completa.`
}
