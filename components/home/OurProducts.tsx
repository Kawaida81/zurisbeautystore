'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

const products = [
  {
    id: 1,
    name: 'Nail Polish',
    image: '/images/Nail Polish.jpg',
    rating: 5.0,
    price: 212,
    originalPrice: 232,
    discount: 20,
  },
  {
    id: 2,
    name: 'Makeup Kit',
    image: '/images/Makeup Kit.jpg',
    rating: 4.0,
    price: 145,
  },
  {
    id: 3,
    name: 'Eye Pencil',
    image: '/images/Eye Pencil.jpg',
    rating: 3.0,
    price: 80,
  },
  {
    id: 4,
    name: 'Lip gloss',
    image: '/images/Lip Gloss.jpg',
    rating: 4.5,
    price: 210,
  },
]

export default function OurProducts() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-[#FF6B6B]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-3xl font-bold mb-8 md:mb-12 text-center text-[#0A0A0A]">OUR PRODUCTS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-[#FFFFFF] p-4 rounded-xl shadow-sm group hover:shadow-lg transition-all duration-300">
              <div className="aspect-square relative mb-4 rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#0A0A0A]">{product.name}</h3>
              <div className="flex items-center mb-2">
                <div className="flex text-[#FF6B6B]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(product.rating) ? '★' : i < product.rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-[#0A0A0A]/60">{product.rating}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#0A0A0A]">Kes {product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-sm text-[#0A0A0A]/40 line-through">
                      Kes {product.originalPrice}
                    </span>
                    <span className="text-sm text-[#FF6B6B]">-{product.discount}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg" className="border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B]/5 px-8 py-6 text-lg rounded-full">
            <Link href="/products">View All</Link>
          </Button>
        </div>
      </div>
    </section>
  )
} 