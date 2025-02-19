import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-[#6C63FF]">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
          <p className="text-gray-600 max-w-sm mx-auto">
            Sorry, we couldn't find the page you're looking for. Please check the URL or return to the homepage.
          </p>
        </div>
        
        <Link href="/" className="inline-block">
          <Button 
            variant="default" 
            className="bg-[#6C63FF] hover:bg-[#6C63FF]/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
} 