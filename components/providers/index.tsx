'use client'

import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { SupabaseProvider } from './supabase-provider'
import { CartProvider } from './cart-provider'
import { SearchProvider } from './search-provider'
import QueryProvider from './query-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <CartProvider>
        <QueryProvider>
          <SearchProvider>
            <Toaster position="top-center" />
            {children}
          </SearchProvider>
        </QueryProvider>
      </CartProvider>
    </SupabaseProvider>
  )
} 