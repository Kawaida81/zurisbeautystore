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
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Disable webpack cache
    config.cache = false;

    // Add polyfills for server-side
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'process': 'process/browser',
      };
    }

    return config;
  },
};

module.exports = nextConfig; 