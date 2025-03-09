'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingCart, User, Menu } from 'lucide-react'
import { Input } from '../ui/input'
import { useSupabase } from '../providers/supabase-provider'
import { useCart } from '../providers/cart-provider'
import { useSearch } from '../providers/search-provider'
import { Badge } from '../ui/badge'
import SearchResults from './SearchResults'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const [mounted, setMounted] = React.useState(false)
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [authUser, setAuthUser] = React.useState<any>(null)
  const { user } = useSupabase()
  const { cartCount } = useCart()
  const { searchQuery, setSearchQuery } = useSearch()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    setMounted(true)
    setAuthUser(user)
  }, [user])

  const handleTopSellingClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (pathname !== '/') {
      // If not on home page, navigate to home page with hash
      router.push('/#top-selling')
    } else {
      // If on home page, smooth scroll to section
      document.getElementById('top-selling')?.scrollIntoView({ behavior: 'smooth' })
    }
    // Close mobile menu if open
    setIsMenuOpen(false)
  }

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
    <TooltipProvider>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="/#top-selling"
                    onClick={handleTopSellingClick}
                    className="text-white/90 hover:text-white transition-colors cursor-pointer"
                  >
                    Top Selling
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  View our best-selling products
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/products" className="text-white/90 hover:text-white transition-colors">
                    Our Products
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Browse our complete collection
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/services" className="text-white/90 hover:text-white transition-colors">
                    Our Services
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Explore our beauty services
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/book" className="text-white/90 hover:text-white transition-colors">
                    Book an Appointment
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  Schedule your beauty session
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Search and Icons */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center bg-white/10 rounded-full px-4 py-2 relative">
                <Input
                  type="search"
                  placeholder="Search for products..."
                  className="bg-transparent border-none focus:outline-none w-64 text-white placeholder:text-white/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="h-5 w-5 text-white/60 hover:text-white transition-colors cursor-pointer" />
                <SearchResults />
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/checkout" className="text-white/90 hover:text-white transition-colors relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  {cartCount > 0 ? `Proceed to checkout (${cartCount} item${cartCount === 1 ? '' : 's'})` : 'Your cart is empty'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  {authUser ? (
                    <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
                      <User className="h-6 w-6" />
                    </Link>
                  ) : (
                    <Link href="/sign-in" className="text-white/90 hover:text-white transition-colors">
                      <User className="h-6 w-6" />
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {authUser ? 'View your dashboard' : 'Sign in to your account'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && mounted && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="flex flex-col space-y-4">
                <a
                  href="/#top-selling"
                  onClick={handleTopSellingClick}
                  className="text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  Top Selling
                </a>
                <Link href="/products" className="text-white/90 hover:text-white transition-colors">
                  Our Products
                </Link>
                <Link href="/services" className="text-white/90 hover:text-white transition-colors">
                  Our Services
                </Link>
                <Link href="/book" className="text-white/90 hover:text-white transition-colors">
                  Book an Appointment
                </Link>
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2 relative">
                  <Input
                    type="search"
                    placeholder="Search for products..."
                    className="bg-transparent border-none focus:outline-none w-full text-white placeholder:text-white/60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="h-5 w-5 text-white/60 hover:text-white transition-colors cursor-pointer" />
                  <SearchResults />
                </div>
                <div className="flex items-center space-x-6 pt-4 border-t border-white/10">
                  <Link href="/checkout" className="text-white/90 hover:text-white transition-colors relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {cartCount}
                      </Badge>
                    )}
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
    </TooltipProvider>
  )
}

export default Navbar 