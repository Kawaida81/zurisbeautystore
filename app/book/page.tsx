'use client'

import TopBanner from '@/components/home/TopBanner'
import Navbar from '@/components/home/Navbar'
import Footer from '@/components/home/Footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function BookPage() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Navbar />
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Book an Appointment</h1>
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <div className="space-y-6">
              <p className="text-gray-600">
                Ready to transform your smile? To book an appointment, you'll need to create a quick account first. 
                This helps us provide you with the best possible care and keep track of your Beauty journey. Click below to get started!
              </p>
              <Button asChild className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90">
                <Link href="/sign-up">Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
} 