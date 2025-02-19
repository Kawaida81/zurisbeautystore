declare module '@/lib/supabase/client' {
  import { SupabaseClient } from '@supabase/supabase-js'
  
  export function createClient(): SupabaseClient
} 