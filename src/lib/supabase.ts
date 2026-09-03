import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// Enquanto VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não estiverem definidas
// (veja .env.example), o app roda inteiramente com os dados mock em src/data/mock.ts.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
