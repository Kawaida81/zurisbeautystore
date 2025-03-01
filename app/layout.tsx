import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://zurisbeautystore.pages.dev'),
  title: "Zuri's Beauty Salon",
  description: 'Modern beauty salon management application',
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
