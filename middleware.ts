import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  // Handle authentication errors
  if (error) {
    console.error('Auth error in middleware:', error)
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Public routes that don't need auth
  const publicRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/']
  if (publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    if (session) {
      try {
        // Get user role and active status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_active')
          .eq('id', session.user.id)
          .single()

        if (userError || !userData) {
          throw new Error('Failed to fetch user data')
        }

        if (!userData.is_active) {
          await supabase.auth.signOut()
          return NextResponse.redirect(
            new URL('/sign-in?message=Account is inactive', req.url)
          )
        }

        // Redirect based on role
        switch (userData.role) {
          case 'admin':
            return NextResponse.redirect(new URL('/admin/dashboard', req.url))
          case 'worker':
            return NextResponse.redirect(new URL('/worker/dashboard', req.url))
          case 'client':
            return NextResponse.redirect(new URL('/dashboard', req.url))
          default:
            // Invalid role - sign out and redirect to sign in
            await supabase.auth.signOut()
            return NextResponse.redirect(
              new URL('/sign-in?message=Invalid user role', req.url)
            )
        }
      } catch (error) {
        console.error('Error in middleware:', error)
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/sign-in?message=Authentication error', req.url)
        )
      }
    }
    return res
  }

  // Protected routes - redirect to sign in if not authenticated
  if (!session) {
    const returnUrl = encodeURIComponent(req.nextUrl.pathname)
    return NextResponse.redirect(
      new URL(`/sign-in?returnUrl=${returnUrl}`, req.url)
    )
  }

  try {
    // Get user data for role-based access control
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      throw new Error('Failed to fetch user data')
    }

    if (!userData.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/sign-in?message=Account is inactive', req.url)
      )
    }

    // Admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (userData.role !== 'admin') {
        return NextResponse.redirect(
          new URL('/dashboard?message=Access denied', req.url)
        )
      }
      return res
    }

    // Worker routes
    if (req.nextUrl.pathname.startsWith('/worker')) {
      if (userData.role !== 'worker') {
        return NextResponse.redirect(
          new URL('/dashboard?message=Access denied', req.url)
        )
      }
      return res
    }

    // Client routes (dashboard)
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (userData.role === 'client') {
        return res
      }
      // Redirect non-clients to their respective dashboards
      switch (userData.role) {
        case 'admin':
          return NextResponse.redirect(new URL('/admin/dashboard', req.url))
        case 'worker':
          return NextResponse.redirect(new URL('/worker/dashboard', req.url))
        default:
          return NextResponse.redirect(
            new URL('/sign-in?message=Invalid user role', req.url)
          )
      }
    }

    return res
  } catch (error) {
    console.error('Error in middleware:', error)
    await supabase.auth.signOut()
    return NextResponse.redirect(
      new URL('/sign-in?message=Authentication error', req.url)
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}