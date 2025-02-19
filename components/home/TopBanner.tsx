'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const offers = [
  {
    id: 1,
    text: "🎉 New Customer Special: Get 20% OFF your first appointment!",
    cta: "Book Now",
    link: "/sign-up",
    promoCode: "NEWCLIENT20"
  },
  {
    id: 2,
    text: "✨ Limited Time: Free Beauty Consultation for New Clients",
    cta: "Claim Now",
    link: "/sign-up",
    promoCode: "FREECONSULT"
  },
  {
    id: 3,
    text: "💄 Join Our Beauty Club - Exclusive Member Benefits!",
    cta: "Join Free",
    link: "/sign-up",
    promoCode: "BEAUTYCLUB"
  }
]

export default function TopBanner() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // First, set mounted to true
    setMounted(true)

    // Then check localStorage
    const checkBannerState = () => {
      try {
        const bannerClosed = localStorage.getItem('topBannerClosed')
        if (bannerClosed === 'true') {
          setIsVisible(false)
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error)
      }
    }

    checkBannerState()
  }, [])

  useEffect(() => {
    if (!mounted || !isVisible) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentOfferIndex((current) => (current + 1) % offers.length)
        setIsAnimating(false)
      }, 500)
    }, 5000)

    return () => clearInterval(interval)
  }, [mounted, isVisible])

  const handleClose = () => {
    if (!mounted) return
    try {
      setIsVisible(false)
      localStorage.setItem('topBannerClosed', 'true')
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      setIsVisible(false)
    }
  }

  const handleOfferClick = (offer: typeof offers[0]) => {
    if (!mounted) return
    try {
      sessionStorage.setItem('selectedPromo', offer.promoCode)
    } catch (error) {
      console.error('Error saving to sessionStorage:', error)
    }
    router.push(offer.link)
  }

  // Initial server-side render state
  if (!mounted) {
    return (
      <div className="bg-white text-[#FF6B6B] relative border-b border-[#FF6B6B]/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="py-3 flex items-center justify-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm sm:text-base font-medium">
                {offers[0].text}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if banner should be hidden
  if (!isVisible) return null

  const currentOffer = offers[currentOfferIndex]

  return (
    <div className="bg-white text-[#FF6B6B] relative border-b border-[#FF6B6B]/10">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#FF6B6B] rounded-full -translate-x-20 -translate-y-20 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#FF6B6B] rounded-full translate-x-20 translate-y-20 animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="py-3 flex items-center justify-center">
          <div 
            className={`flex items-center justify-center gap-2 transition-all duration-500 transform
              ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}
            `}
          >
            <span className="text-sm sm:text-base font-medium">
              {currentOffer.text}
            </span>
            <button 
              onClick={() => handleOfferClick(currentOffer)}
              className="inline-flex items-center justify-center bg-[#FF6B6B] text-white px-4 py-1.5 rounded-full 
                text-sm font-semibold hover:bg-[#FF6B6B]/90 transition-all duration-300 cursor-pointer
                hover:scale-105 transform hover:shadow-lg active:scale-95"
            >
              {currentOffer.cta}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="absolute right-4 p-2 hover:bg-[#FF6B6B]/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close banner"
          >
            <X className="h-5 w-5 text-[#FF6B6B]" />
          </button>
        </div>
      </div>
    </div>
  )
} 