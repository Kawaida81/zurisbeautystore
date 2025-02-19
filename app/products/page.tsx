import TopBanner from '@/components/home/TopBanner'
import Navbar from '@/components/home/Navbar'
import Footer from '@/components/home/Footer'
import OurProducts from '@/components/home/OurProducts'

export default function ProductsPage() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Navbar />
      <div className="py-8">
        <OurProducts />
      </div>
      <Footer />
    </main>
  )
} 