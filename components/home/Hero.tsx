'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-[#FFFFFF]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[#0A0A0A]">
              WHERE BEAUTY <span className="text-[#FF6B6B]">MEETS</span> CONFIDENCE
            </h1>
            <p className="text-lg text-[#0A0A0A]/70 leading-relaxed">
              Bringing out the best version of you!
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                asChild 
                size="lg" 
                className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-[#FFFFFF] px-8 py-6 text-lg rounded-full transition-transform hover:scale-105"
              >
                <Link href="/services">
                  Discover Our Services
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline"
                className="border-[#0A0A0A]/20 hover:border-[#FF6B6B] text-[#0A0A0A] hover:text-[#FF6B6B] px-8 py-6 text-lg rounded-full transition-all hover:bg-[#FF6B6B]/5"
              >
                <Link href="/products">
                  Shop Now
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-6 border-t border-[#F9FAFB]">
              <div className="transform transition-all hover:translate-y-[-4px]">
                <h3 className="text-3xl font-bold text-[#0A0A0A] mb-1">200+</h3>
                <p className="text-[#0A0A0A]/60 font-medium text-sm">High-Quality Products</p>
              </div>
              <div className="transform transition-all hover:translate-y-[-4px]">
                <h3 className="text-3xl font-bold text-[#0A0A0A] mb-1">1000+</h3>
                <p className="text-[#0A0A0A]/60 font-medium text-sm">Happy Customers</p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] relative rounded-xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[#FF6B6B]/10 mix-blend-multiply z-10" />
              <Image
                src="/images/hero-image.jpg"
                alt="Beauty Products"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
            <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-[#F9FAFB] rounded-full -z-10" />
            <div className="absolute -top-3 -left-3 w-20 h-20 bg-[#FF6B6B]/10 rounded-full -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
} 