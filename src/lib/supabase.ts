import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('Supabase env vars missing — running in demo mode')
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')

export const isDemoMode = !url || !key
