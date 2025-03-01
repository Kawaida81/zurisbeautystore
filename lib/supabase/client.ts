import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

let supabaseInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null

export const createClient = () => {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'zuris-beauty-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  })

  return supabaseInstance
}