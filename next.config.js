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
    serverActions: true,
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'date-fns',
      'framer-motion',
      'lucide-react'
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Apply optimizations for both client and edge-server builds in production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
        splitChunks: {
          chunks: 'all',
          minSize: 4000,
          maxSize: 4000000, // 4MB max chunk size
          minChunks: 1,
          maxInitialRequests: 20,
          maxAsyncRequests: 20,
          cacheGroups: {
            default: false,
            vendors: false,
            // Core framework libraries
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 60,
              chunks: 'all',
              enforce: true,
              maxSize: 4000000 // 4MB limit
            },
            // Supabase related chunks
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              priority: 50,
              chunks: 'all',
              maxSize: 4000000
            },
            // Query related chunks
            query: {
              name: 'query',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              priority: 45,
              chunks: 'all',
              maxSize: 4000000
            },
            // UI Components
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
              priority: 40,
              chunks: 'all',
              maxSize: 4000000
            },
            // Common chunks
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 30,
              reuseExistingChunk: true,
              maxSize: 4000000
            },
            // Styles
            styles: {
              name: 'styles',
              test: /\.(css|scss|sass)$/,
              chunks: 'all',
              enforce: true,
              maxSize: 2000000
            },
            // Third party libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (!match) return 'lib';
                const packageName = match[1];
                return `lib.${packageName.replace('@', '')}`;
              },
              priority: 20,
              minChunks: 1,
              reuseExistingChunk: true,
              maxSize: 4000000
            }
          }
        }
      };

      // Disable source maps in production
      config.devtool = false;

      // Configure webpack cache with compression
      config.cache = {
        type: 'filesystem',
        version: '3.0.0', // Increment version to invalidate cache
        compression: 'brotli',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        buildDependencies: {
          config: [__filename]
        },
        cacheDirectory: '.next/cache/webpack',
        compression: {
          level: 11 // Maximum compression
        },
        name: isServer ? 'server' : 'client', // Separate caches for server and client
        store: 'pack',
        memoryCacheUnaffected: true
      };

      // Additional optimizations
      config.performance = {
        maxAssetSize: 4000000,
        maxEntrypointSize: 4000000,
        hints: 'warning'
      };

      // Exclude certain dependencies from the server build
      if (isServer) {
        config.externals = [
          ...(config.externals || []),
          'bufferutil',
          'utf-8-validate',
          '@supabase/supabase-js',
          '@tanstack/react-query',
          'framer-motion'
        ];
      }
    }

    return config;
  },
  // Clean webpack cache when building for production
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 2
  }
}

module.exports = nextConfig 