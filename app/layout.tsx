import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zuris Beauty',
  description: 'Book your beauty appointments with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <SupabaseProvider>
          <Toaster position="top-center" />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
