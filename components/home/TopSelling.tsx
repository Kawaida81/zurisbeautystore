'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

const products = [
  {
    id: 1,
    name: 'Earrings',
    image: '/images/Earrings.jpg',
    rating: 4.5,
    price: 120,
  },
  {
    id: 2,
    name: 'Brushes',
    image: '/images/Brushes.jpg',
    rating: 3.5,
    price: 240,
    originalPrice: 260,
    discount: 20,
  },
  {
    id: 3,
    name: 'Colossal',
    image: '/images/Colossal.jpg',
    rating: 4.5,
    price: 180,
  },
  {
    id: 4,
    name: 'Earrings',
    image: '/images/Earrings 1.jpg',
    rating: 4.5,
    price: 130,
    originalPrice: 160,
    discount: 30,
  },
]

export default function TopSelling() {
  return (
    <section id="top-selling" className="py-16 scroll-mt-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">TOP SELLING</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group">
              <div className="aspect-square relative mb-4 rounded-lg overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(product.rating) ? '★' : i < product.rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{product.rating}/5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">Kes {product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      Kes {product.originalPrice}
                    </span>
                    <span className="text-sm text-red-500">-{product.discount}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/products">View All</Link>
          </Button>
        </div>
      </div>
    </section>
  )
} 