/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      '@headlessui/react',
      '@heroicons/react',
      '@tremor/react',
      'date-fns',
      'recharts',
    ],
  },
};

module.exports = nextConfig; 