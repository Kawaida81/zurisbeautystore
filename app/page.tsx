'use client'

import TopBanner from '@/components/home/TopBanner'
import Navbar from '@/components/home/Navbar'
import Hero from '@/components/home/Hero'
import TestimonialsBar from '@/components/home/TestimonialsBar'
import TopSelling from '@/components/home/TopSelling'
import Services from '@/components/home/Services'
import OurProducts from '@/components/home/OurProducts'
import Testimonials from '@/components/home/Testimonials'
import Footer from '@/components/home/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Navbar />
      <Hero />
      <TestimonialsBar />
      <TopSelling />
      <Services />
      <OurProducts />
      <Testimonials />
      <Footer />
    </main>
  )
}
