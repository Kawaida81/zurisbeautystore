/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  output: 'standalone',
  generateBuildId: () => 'build',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      'lucide-react',
      '@hookform/resolvers',
      'next-themes',
      'react-hook-form',
      'zod'
    ],
    serverActions: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Disable source maps in production
    if (process.env.NODE_ENV === 'production') {
      config.devtool = false;
    }

    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      },
    }

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      minimize: true,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      mangleExports: true,
      concatenateModules: true,
    };

    return config;
  },
};

module.exports = nextConfig; 