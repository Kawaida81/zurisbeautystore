import TopBanner from '@/components/home/TopBanner'
import Navbar from '@/components/home/Navbar'
import Footer from '@/components/home/Footer'
import Services from '@/components/home/Services'

export default function ServicesPage() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Navbar />
      <div className="py-8">
        <Services />
      </div>
      <Footer />
    </main>
  )
} 