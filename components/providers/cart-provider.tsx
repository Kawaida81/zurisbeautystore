'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface CartItem {
  id: number
  section: 'top-selling' | 'our-products'
  name: string
  price: number
  image: string
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: number, section: string) => void
  isInCart: (itemId: number, section: string) => boolean
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => [...prev, item])
  }

  const removeFromCart = (itemId: number, section: string) => {
    setCartItems((prev) => 
      prev.filter((item) => !(item.id === itemId && item.section === section))
    )
  }

  const isInCart = (itemId: number, section: string) => {
    return cartItems.some((item) => item.id === itemId && item.section === section)
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    isInCart,
    cartCount: cartItems.length,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
} 