'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#FF6B6B]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {/* Brand Column */}
          <div className="space-y-4 md:space-y-6">
            <Link href="/" className="text-3xl font-bold text-[#FFFFFF] hover:text-[#FFFFFF]/90 transition-colors">
              ZURI&apos;s Beauty
            </Link>
            <p className="text-base text-[#FFFFFF]/80 leading-relaxed max-w-sm">
              Your reliable and transparent service provider. Certified MUA/ HAIRSTYLIST.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors">
                <div className="w-8 h-8 relative rounded-full overflow-hidden">
                  <Image 
                    src="/images/Whatsapp.png" 
                    alt="WhatsApp" 
                    fill
                    className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                  />
                </div>
              </Link>
              <Link href="#" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors">
                <div className="w-8 h-8 relative rounded-full overflow-hidden">
                  <Image 
                    src="/images/Facebook.png" 
                    alt="Facebook" 
                    fill
                    className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                  />
                </div>
              </Link>
              <Link href="#" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors">
                <div className="w-8 h-8 relative rounded-full overflow-hidden">
                  <Image 
                    src="/images/Instagram.jpg" 
                    alt="Instagram" 
                    fill
                    className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                  />
                </div>
              </Link>
            </div>
          </div>

          {/* Business Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#FFFFFF]">BUSINESS</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  About
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/works" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Works
                </Link>
              </li>
              <li>
                <Link href="/career" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Career
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#FFFFFF]">HELP</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Customer Support
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Delivery Details
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* FAQ Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[#FFFFFF]">FAQ</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/account" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Account
                </Link>
              </li>
              <li>
                <Link href="/deliveries" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Manage Deliveries
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/payments" className="text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors text-base">
                  Payments
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 pt-6 border-t border-[#FFFFFF]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#FFFFFF]/80">ZURI&apos;s Beauty © 2025, All Rights Reserved</p>
            <div className="flex items-center gap-6">
              <div className="h-8 relative aspect-[3/2]">
                <Image 
                  src="/images/visa.png" 
                  alt="Visa" 
                  fill
                  className="object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="h-8 relative aspect-[3/2]">
                <Image 
                  src="/images/Mpesa.png" 
                  alt="Mpesa" 
                  fill
                  className="object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="h-8 relative aspect-[3/2]">
                <Image 
                  src="/images/Airtel-money.png" 
                  alt="Airtel" 
                  fill
                  className="object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 