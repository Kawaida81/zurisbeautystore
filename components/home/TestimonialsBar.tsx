'use client'

import { useEffect, useState } from 'react'

const testimonials = [
  '⭐ "Amazing service, my hair looks fantastic!" - Sarah M.',
  '⭐ "Best beauty salon in town, highly recommend!" - Jane K.',
  '⭐ "Professional and friendly staff, love the results!" - Mary W.',
  '⭐ "Excellent makeup for my wedding day!" - Lisa R.',
  '⭐ "Great products and amazing customer service!" - Anna P.',
  '⭐ "The nail art is absolutely stunning!" - Emily T.'
]

export default function TestimonialsBar() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="py-12 bg-[#FF6B6B]/5 border-y border-[#FF6B6B]/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/5 via-transparent to-[#FF6B6B]/5 pointer-events-none" />
          {mounted ? (
            <>
              <style jsx>{`
                @keyframes scroll {
                  0% {
                    transform: translateX(0);
                  }
                  100% {
                    transform: translateX(-50%);
                  }
                }
                .animate-scroll {
                  animation: scroll 30s linear infinite;
                }
                .animate-scroll:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="flex whitespace-nowrap animate-scroll">
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div 
                    key={`${testimonial}-${index}`}
                    className="inline-flex items-center justify-center px-8"
                  >
                    <span className="text-lg font-medium text-[#0A0A0A]/70 hover:text-[#FF6B6B] transition-colors">
                      {testimonial}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center flex-wrap gap-6 py-4">
              {testimonials.slice(0, 3).map((testimonial, index) => (
                <div 
                  key={`${testimonial}-${index}`}
                  className="text-lg font-medium text-[#0A0A0A]/70"
                >
                  {testimonial}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
} 