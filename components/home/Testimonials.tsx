'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    rating: 5,
    text: 'I\'m blown away by the quality and professionalism at Zuri\'s Beauty. Every visit has been an amazing experience, and the results always exceed my expectations.',
  },
  {
    id: 2,
    name: 'Alex K.',
    rating: 5,
    text: 'Finding a reliable beauty salon was a challenge until I discovered Zuri\'s Beauty. Their range of services is truly remarkable, and the staff is incredibly skilled.',
  },
  {
    id: 3,
    name: 'James L.',
    rating: 5,
    text: 'As someone who\'s always looking for top-notch beauty services, I\'m thrilled to have found Zuri\'s Beauty. The attention to detail and customer service is outstanding.',
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => {
    setCurrentIndex((current) => (current + 1) % testimonials.length)
  }

  const previous = () => {
    setCurrentIndex((current) => (current - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-[#FF6B6B]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-12">
          <h2 className="text-3xl font-bold text-center text-[#0A0A0A] mb-4 sm:mb-0">OUR HAPPY CUSTOMERS</h2>
          <div className="flex gap-2">
            <button
              onClick={previous}
              className="p-2 rounded-full border border-[#FF6B6B]/20 hover:bg-[#FF6B6B]/10 text-[#FF6B6B] transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="p-2 rounded-full border border-[#FF6B6B]/20 hover:bg-[#FF6B6B]/10 text-[#FF6B6B] transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`bg-[#FFFFFF] p-8 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md ${
                index === currentIndex ? 'opacity-100 scale-105' : 'opacity-50 scale-100'
              }`}
            >
              <div className="flex text-[#FF6B6B] mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#0A0A0A]">
                  {testimonial.name} <span className="text-[#FF6B6B]">✓</span>
                </h3>
              </div>
              <p className="text-[#0A0A0A]/70">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 