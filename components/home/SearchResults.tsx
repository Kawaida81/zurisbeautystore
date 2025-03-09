'use client'

import { useSearch } from '../providers/search-provider'
import { useCart } from '../providers/cart-provider'
import { Button } from '../ui/button'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function SearchResults() {
  const { searchResults, isSearching, searchQuery, setSearchQuery } = useSearch()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const router = useRouter()

  if (!isSearching) return null

  const handleCartAction = (
    e: React.MouseEvent,
    product: any
  ) => {
    e.stopPropagation()
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

  const handleProductClick = (product: any) => {
    setSearchQuery('')
    router.push(`/products?highlight=${product.section}-${product.id}`)
  }

  return (
    <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl mt-2 z-50 max-h-[85vh] overflow-y-auto border border-gray-100">
      <div className="p-3">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-sm font-medium">
              No products found for "{searchQuery}"
            </p>
            <p className="text-xs mt-1 text-gray-400">
              Try searching for something else
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-400 px-2 mb-2">
              Found {searchResults.length} product{searchResults.length === 1 ? '' : 's'}
            </p>
            <div className="space-y-1">
              {searchResults.map((product) => (
                <div
                  key={`${product.section}-${product.id}`}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50/80 rounded-lg transition-all cursor-pointer group relative"
                >
                  {/* Product Image */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0 py-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-[#FF6B6B] transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center text-yellow-400 text-[10px]">
                        {'★'.repeat(Math.floor(product.rating))}
                        <span className="text-gray-400 ml-1">({product.rating})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-semibold text-gray-900">Kes {product.price}</span>
                      {'originalPrice' in product && (
                        <span className="text-xs text-[#FF6B6B] font-medium">
                          Save {product.discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={(e) => handleCartAction(e, product)}
                    variant={isInCart(product.id, product.section) ? "destructive" : "default"}
                    size="sm"
                    className={`h-8 px-3 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 absolute right-2 ${
                      isInCart(product.id, product.section) 
                        ? 'bg-red-50 hover:bg-red-100 text-red-600' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isInCart(product.id, product.section) ? (
                      'Remove'
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 