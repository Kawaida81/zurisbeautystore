'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!loading && user) {
        const supabase = createClient()
        
        // Get user role
        const { data: profile, error } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          // Handle error by signing out
          await supabase.auth.signOut()
          router.push('/sign-in?message=Authentication error')
          return
        }

        if (!profile.is_active) {
          // Handle inactive account
          await supabase.auth.signOut()
          router.push('/sign-in?message=Account is inactive')
          return
        }

        // Redirect based on role
        switch (profile.role) {
          case 'worker':
            router.push('/worker/dashboard')
            break
          case 'client':
            router.push('/dashboard')
            break
          default:
            // Invalid role - sign out and redirect
            await supabase.auth.signOut()
            router.push('/sign-in?message=Invalid user role')
        }
      }
    }

    checkUserAndRedirect()
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F5]">
        <div className="w-8 h-8 border-4 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <Toaster position="top-center" />
      {children}
    </div>
  )
} 