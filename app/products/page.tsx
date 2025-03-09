import TopBanner from '@/components/home/TopBanner'
import Navbar from '@/components/home/Navbar'
import Footer from '@/components/home/Footer'
import AllProducts from '@/components/products/AllProducts'

export default function ProductsPage() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Navbar />
      <div className="py-8">
        <AllProducts />
      </div>
      <Footer />
    </main>
  )
} 