/** @type {import('next').NextConfig} */

const setupDevPlatform = process.env.NODE_ENV === 'development' 
  ? require('@cloudflare/next-on-pages/next-dev').setupDevPlatform
  : () => {};

if (process.env.NODE_ENV === 'development') {
  setupDevPlatform();
}

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