'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// Import products data
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

const allProducts = [...topSellingProducts, ...ourProducts]

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: typeof allProducts
  isSearching: boolean
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Filter products based on search query
  const searchResults = searchQuery
    ? allProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const value = {
    searchQuery,
    setSearchQuery: (query: string) => {
      setSearchQuery(query)
      setIsSearching(!!query)
    },
    searchResults,
    isSearching,
  }

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
} 