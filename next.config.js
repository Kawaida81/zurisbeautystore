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
  output: 'standalone',
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    serverActions: true
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 24000000,
      cacheGroups: {
        default: false,
        vendors: false
      }
    };
    return config;
  }
}

module.exports = nextConfig 