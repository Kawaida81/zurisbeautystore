'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, User, Menu } from 'lucide-react'
import { Input } from '../ui/input'
import { useSupabase } from '../providers/supabase-provider'

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const [mounted, setMounted] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [authUser, setAuthUser] = React.useState<any>(null)
  const { user } = useSupabase()

  React.useEffect(() => {
    setMounted(true)
    setAuthUser(user)
  }, [user])

  // Don't render anything until after hydration
  if (!mounted) {
    return (
      <nav className="border-b border-[#FF6B6B]/20 bg-[#FF6B6B] sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="text-xl md:text-2xl font-bold text-white">
              ZURI&apos;s Beauty
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b border-[#FF6B6B]/20 bg-[#FF6B6B] sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="text-xl md:text-2xl font-bold text-white hover:text-white/90 transition-colors">
            ZURI&apos;s Beauty
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-full hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6 text-white" />
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/new-stock" className="text-white/90 hover:text-white transition-colors">
              New Stock
            </Link>
            <Link href="/products" className="text-white/90 hover:text-white transition-colors">
              Our Products
            </Link>
            <Link href="/services" className="text-white/90 hover:text-white transition-colors">
              Our Services
            </Link>
            <Link href="/book" className="text-white/90 hover:text-white transition-colors">
              Book an Appointment
            </Link>
          </div>

          {/* Search and Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
              <Input
                type="search"
                placeholder="Search for products..."
                className="bg-transparent border-none focus:outline-none w-64 text-white placeholder:text-white/60"
              />
              <Search className="h-5 w-5 text-white/60 hover:text-white transition-colors cursor-pointer" />
            </div>
            <Link href="/cart" className="text-white/90 hover:text-white transition-colors">
              <ShoppingCart className="h-6 w-6" />
            </Link>
            {authUser ? (
              <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
                <User className="h-6 w-6" />
              </Link>
            ) : (
              <Link href="/sign-in" className="text-white/90 hover:text-white transition-colors">
                <User className="h-6 w-6" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && mounted && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              <Link href="/new-stock" className="text-white/90 hover:text-white transition-colors">
                New Stock
              </Link>
              <Link href="/products" className="text-white/90 hover:text-white transition-colors">
                Our Products
              </Link>
              <Link href="/services" className="text-white/90 hover:text-white transition-colors">
                Our Services
              </Link>
              <Link href="/book" className="text-white/90 hover:text-white transition-colors">
                Book an Appointment
              </Link>
              <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                <Input
                  type="search"
                  placeholder="Search for products..."
                  className="bg-transparent border-none focus:outline-none w-full text-white placeholder:text-white/60"
                />
                <Search className="h-5 w-5 text-white/60 hover:text-white transition-colors cursor-pointer" />
              </div>
              <div className="flex items-center space-x-6 pt-4 border-t border-white/10">
                <Link href="/cart" className="text-white/90 hover:text-white transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                </Link>
                {authUser ? (
                  <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
                    <User className="h-6 w-6" />
                  </Link>
                ) : (
                  <Link href="/sign-in" className="text-white/90 hover:text-white transition-colors">
                    <User className="h-6 w-6" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar 