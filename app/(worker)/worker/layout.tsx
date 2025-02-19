'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { createClient } from '@/lib/supabase/client'
import { 
  User, 
  LogOut, 
  Calendar, 
  DollarSign, 
  Package, 
  Bell, 
  BarChart3,
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
    href: '/worker/dashboard',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    title: 'Appointments',
    href: '/worker/appointments',
    icon: <Calendar className="h-5 w-5" />
  },
  {
    title: 'Sales',
    href: '/worker/sales',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    title: 'Inventory',
    href: '/worker/inventory',
    icon: <Package className="h-5 w-5" />
  }
]

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useSupabase()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in')
    }
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
              <Link href="/worker/dashboard" className="text-2xl font-bold text-[#FF6B6B]">
                ZURI&apos;s Beauty
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
              <Link href="/worker/notifications" className="text-gray-600 hover:text-[#FF6B6B]">
                <Bell className="h-5 w-5" />
              </Link>
              <Link href="/worker/profile" className="text-gray-600 hover:text-[#FF6B6B]">
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