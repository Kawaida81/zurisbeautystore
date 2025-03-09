'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useCart } from '../providers/cart-provider'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Import products from both sections
const topSellingProducts = [
  {
    id: 1,
    name: 'Earrings',
    image: '/images/Earrings.jpg',
    rating: 4.5,
    price: 120,
    section: 'top-selling' as const,
  },
  {
    id: 2,
    name: 'Brushes',
    image: '/images/Brushes.jpg',
    rating: 3.5,
    price: 240,
    originalPrice: 260,
    discount: 20,
    section: 'top-selling' as const,
  },
  {
    id: 3,
    name: 'Colossal',
    image: '/images/Colossal.jpg',
    rating: 4.5,
    price: 180,
    section: 'top-selling' as const,
  },
  {
    id: 4,
    name: 'Earrings',
    image: '/images/Earrings 1.jpg',
    rating: 4.5,
    price: 130,
    originalPrice: 160,
    discount: 30,
    section: 'top-selling' as const,
  },
]

const ourProducts = [
  {
    id: 1,
    name: 'Nail Polish',
    image: '/images/Nail-Polish.jpg',
    rating: 5.0,
    price: 212,
    originalPrice: 232,
    discount: 20,
    section: 'our-products' as const,
  },
  {
    id: 2,
    name: 'Makeup Kit',
    image: '/images/Makeup-Kit.jpg',
    rating: 4.0,
    price: 145,
    section: 'our-products' as const,
  },
  {
    id: 3,
    name: 'Eye Pencil',
    image: '/images/Eye-Pencil.jpg',
    rating: 3.0,
    price: 80,
    section: 'our-products' as const,
  },
  {
    id: 4,
    name: 'Lip gloss',
    image: '/images/Lip-gloss.jpg',
    rating: 4.5,
    price: 210,
    section: 'our-products' as const,
  },
]

// Combine all products
const allProducts = [...topSellingProducts, ...ourProducts]

export default function AllProducts() {
  const { addToCart, removeFromCart, isInCart } = useCart()
  const searchParams = useSearchParams()
  const highlightedRef = useRef<HTMLDivElement>(null)
  const highlight = searchParams.get('highlight')

  useEffect(() => {
    if (highlight && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlight])

  const handleCartAction = (product: any) => {
    const cartItem = {
      id: product.id,
      section: product.section,
      name: product.name,
      price: product.price,
      image: product.image,
    }
    
    if (isInCart(product.id, product.section)) {
      removeFromCart(product.id, product.section)
    } else {
      addToCart(cartItem)
    }
  }

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-[#FF6B6B]/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h2 className="text-3xl font-bold mb-8 md:mb-12 text-center text-[#0A0A0A]">ALL PRODUCTS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {allProducts.map((product) => {
            const isHighlighted = highlight === `${product.section}-${product.id}`
            return (
              <div
                key={`${product.section}-${product.id}`}
                ref={isHighlighted ? highlightedRef : null}
                className={`bg-[#FFFFFF] p-4 rounded-xl shadow-sm group hover:shadow-lg transition-all duration-300 ${
                  isHighlighted ? 'ring-2 ring-[#FF6B6B] ring-offset-2' : ''
                }`}
              >
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
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-[#0A0A0A]">Kes {product.price}</span>
                  {'originalPrice' in product && (
                    <>
                      <span className="text-sm text-[#0A0A0A]/40 line-through">
                        Kes {product.originalPrice}
                      </span>
                      <span className="text-sm text-[#FF6B6B]">-{product.discount}%</span>
                    </>
                  )}
                </div>
                <Button
                  onClick={() => handleCartAction(product)}
                  variant={isInCart(product.id, product.section) ? "destructive" : "default"}
                  className="w-full"
                >
                  {isInCart(product.id, product.section) ? 'Remove from Cart' : 'Add to Cart'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
} 