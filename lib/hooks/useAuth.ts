import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SignUpInput, SignInInput } from '@/lib/validations/auth'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const signIn = async ({ email, password }: SignInInput) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (!user) throw new Error('No user returned after sign in')

      // Get user role
      const { data: role, error: roleError } = await supabase
        .rpc('get_user_role', { user_id: user.id })

      if (roleError) {
        console.error('Error fetching user role:', roleError)
        await supabase.auth.signOut()
        throw new Error('Unable to verify user role. Please contact support.')
      }

      // Redirect based on role
      switch (role) {
        case 'admin':
          router.push('/admin/dashboard')
          break
        case 'worker':
          router.push('/worker/dashboard')
          break
        case 'client':
          router.push('/dashboard')
          break
        default:
          await supabase.auth.signOut()
          throw new Error('Invalid user role')
      }
      
      router.refresh()
      return { success: true }
    } catch (error: any) {
      console.error('Sign-in error:', error)
      setError(error.message || 'An unexpected error occurred')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password, fullName, role = 'client', phone }: SignUpInput) => {
    try {
      setLoading(true)
      setError(null)

      // First check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('An account with this email already exists')
      }

      // Create the auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role,
            is_active: true
          }
        },
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No user data returned')
      }

      // Create the user profile
      const { data: profileData, error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: authData.user.id,
        user_email: email,
        user_full_name: fullName,
        user_role: role
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error('Failed to create user profile. Please try signing in again.')
      }

      if (!profileData?.success) {
        console.error('Profile creation failed:', profileData?.message)
        throw new Error(profileData?.message || 'Failed to create user profile')
      }

      router.push('/sign-in?message=Check your email to confirm your account')
      router.refresh()
      return { success: true }
    } catch (error: any) {
      console.error('Sign-up error:', error)
      setError(error.message || 'An unexpected error occurred')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      router.push('/sign-in')
      router.refresh()
      return { success: true }
    } catch (error: any) {
      console.error('Sign-out error:', error)
      setError(error.message || 'An unexpected error occurred')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      router.push('/sign-in?message=Check your email for password reset instructions')
      return { success: true }
    } catch (error: any) {
      console.error('Password reset error:', error)
      setError(error.message || 'An unexpected error occurred')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (newPassword: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      router.push('/sign-in?message=Password updated successfully')
      return { success: true }
    } catch (error: any) {
      console.error('Password update error:', error)
      setError(error.message || 'An unexpected error occurred')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
  }
} 