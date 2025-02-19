'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { createClient } from '@/lib/supabase/client'
import { 
  User, 
  LogOut, 
  LayoutDashboard,
  Users,
  Package,
  Settings,
  Calendar,
  DollarSign,
  BarChart2,
  Bell,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />
  },
  {
    title: 'Appointments',
    href: '/admin/appointments',
    icon: <Calendar className="h-5 w-5" />
  },
  {
    title: 'Sales',
    href: '/admin/sales',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    title: 'Inventory',
    href: '/admin/inventory',
    icon: <Package className="h-5 w-5" />
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart2 className="h-5 w-5" />
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="h-5 w-5" />
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useSupabase()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkAdminAccess = async () => {
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

        if (error) {
          console.error('Error fetching user data:', error)
          router.push('/sign-in')
          return
        }

        if (!userData || !userData.is_active) {
          router.push('/sign-in?message=Account is inactive')
          return
        }

        if (userData.role !== 'admin') {
          // Redirect to appropriate dashboard based on role
          switch (userData.role) {
            case 'worker':
              router.push('/worker/dashboard')
              break
            case 'client':
              router.push('/dashboard')
              break
            default:
              router.push('/sign-in?message=Invalid user role')
          }
        }
      }
    }

    checkAdminAccess()
  }, [user, loading, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-2xl font-bold text-[#FF6B6B]">
                ZURI&apos;s Admin
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#FF6B6B] transition-colors"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              <Link href="/admin/notifications" className="text-gray-600 hover:text-[#FF6B6B]">
                <Bell className="h-5 w-5" />
              </Link>
              <Link href="/admin/profile" className="text-gray-600 hover:text-[#FF6B6B]">
                <User className="h-5 w-5" />
              </Link>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-[#FF6B6B]"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden",
          isMobileMenuOpen ? "block" : "hidden"
        )}>
          <nav className="px-4 py-2 bg-white border-t">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 py-3 text-gray-600 hover:text-[#FF6B6B] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} ZURI&apos;s Beauty. All rights reserved.
        </div>
      </footer>
    </div>
  )
} 