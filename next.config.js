/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
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
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 5000,
          maxSize: 15000,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig; 