'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { createClient } from '@/lib/supabase/client'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    const checkClientAccess = async () => {
      if (!loading) {
        if (!user) {
          router.push('/sign-in')
          return
        }

        const supabase = createClient()
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (error || !userData || !userData.is_active || userData.role !== 'client') {
          router.push('/dashboard')
        }
      }
    }

    checkClientAccess()
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
      </div>
    )
  }

  return <>{children}</>
} 