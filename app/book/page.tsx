import TopBanner from '@/components/home/TopBanner'
import Navbar from '@/components/home/Navbar'
import Footer from '@/components/home/Footer'
import { Button } from '@/components/ui/button'

export default function BookPage() {
  return (
    <main className="min-h-screen">
      <TopBanner />
      <Navbar />
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Book an Appointment</h1>
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
            <form className="space-y-6">
              {/* Form will be implemented later with proper validation and backend integration */}
              <p className="text-gray-600">
                Booking functionality will be implemented soon. Please check back later or contact us
                directly.
              </p>
              <Button className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90">
                Book Now
              </Button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
} 