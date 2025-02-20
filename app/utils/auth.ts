import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@/lib/supabase/server'

const supabase = createClientComponentClient()

export const runtime = "edge"

export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    throw error
  }
  return user
}

export async function handleSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    throw error
  }
  return data
}

export async function handleSignOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
} 