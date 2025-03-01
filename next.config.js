/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ['pxsrrupipvqyccpriceg.supabase.co']
  },
  // Keep your existing config options here
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig 