'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { SignInInput } from '@/lib/validations/auth'
import { signInSchema } from '@/lib/validations/auth'
import type { UserRole } from '@/lib/types/database'

type UserProfileResponse = {
  role: UserRole
  is_active: boolean
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Get return URL and message from URL if they exist
  const returnUrl = searchParams.get('returnUrl')
  const message = searchParams.get('message')

  useEffect(() => {
    if (message) {
      toast.info(message)
    }
  }, [message])

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: SignInInput) => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Step 1: Sign in with email and password
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError || !authData.user) {
        throw new Error(signInError?.message || 'Authentication failed')
      }

      // Step 2: Get user role and active status directly from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        throw new Error('Failed to fetch user profile')
      }

      const userProfile: UserProfileResponse = {
        role: userData.role as UserRole,
        is_active: userData.is_active ?? false
      }

      if (!userProfile.is_active) {
        throw new Error('Your account is currently inactive. Please contact support.')
      }

      // Get redirect path from user role
      let redirectPath = returnUrl || ''
      if (!redirectPath) {
        switch (userProfile.role) {
          case 'admin':
            redirectPath = '/admin'
            break
          case 'worker':
            redirectPath = '/worker/dashboard'
            break
          case 'client':
            redirectPath = '/dashboard'
            break
          default:
            throw new Error('Invalid user role')
        }
      }

      toast.success('Successfully signed in!')
      
      // Use Next.js router for client-side navigation when possible
      if (returnUrl) {
        window.location.href = redirectPath // Force hard navigation for return URLs
      } else {
        router.push(redirectPath)
      }
      
    } catch (error: any) {
      console.error('Sign-in error:', error)
      toast.error(error.message || 'Failed to sign in')
      // Clean up on error
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-[#FF6B6B]">
            ZURI&apos;s Beauty
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/sign-up" className="text-[#FF6B6B] hover:text-[#FF6B6B]/90">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        className="h-12"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="h-12"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-[#FF6B6B] hover:text-[#FF6B6B]/90"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}