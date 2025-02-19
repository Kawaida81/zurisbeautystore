import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function resetPasswordAction(formData: FormData) {
  'use server'
  
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Please fill in all fields' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return { error: error.message }
    }

    return redirect('/sign-in?message=Password updated successfully')
  } catch (error: any) {
    return { error: error.message || 'An error occurred while resetting your password' }
  }
} 