'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { createClient } from '@/lib/supabase/client'

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user } = useSupabase()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkWorkerAccess = async () => {
      try {
        if (!user) {
          router.push('/sign-in')
          return
        }

        const supabase = createClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', user.id)
          .single()

        if (userError || !userData) {
          throw new Error('Failed to verify user role')
        }

        if (userData.role !== 'worker' || !userData.is_active) {
          router.push('/dashboard')
          return
        }

        setLoading(false)
      } catch (error) {
        console.error('Error checking worker access:', error)
        router.push('/dashboard')
      }
    }

    checkWorkerAccess()
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
      </div>
    )
  }

  return <>{children}</>
} 