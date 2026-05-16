import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isDemoMode = !url || !key || url === 'https://tu-proyecto.supabase.co'

export const supabase = isDemoMode
  ? null
  : createClient(url, key, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
        storageKey:         'fpbi-auth-v1',
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
      global: {
        headers: { 'x-app-name': 'finanzas-pro-bi' },
      },
    })
