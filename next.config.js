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
      // Configure webpack cache
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        },
        cacheDirectory: require('path').resolve(__dirname, '.next/cache/webpack'),
        name: isServer ? 'server' : 'client',
        version: '4.0.0'
      };

      // Optimization settings
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
        splitChunks: isServer ? false : {
          chunks: 'all',
          minSize: 20000,
          maxSize: 2000000,
          minChunks: 1,
          maxInitialRequests: 20,
          maxAsyncRequests: 20,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 40,
              enforce: true
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true
            }
          }
        }
      };

      // Disable source maps in production
      config.devtool = false;

      // Performance hints
      config.performance = {
        maxAssetSize: 2000000,
        maxEntrypointSize: 2000000,
        hints: 'warning'
      };

      // Server-specific configurations
      if (isServer) {
        config.output = {
          ...config.output,
          globalObject: 'this'
        };

        // External packages for server build
        config.externals = [
          ...(config.externals || []),
          'bufferutil',
          'utf-8-validate',
          {
            'react-dom/server': 'commonjs react-dom/server',
            '@supabase/supabase-js': 'commonjs @supabase/supabase-js',
            '@tanstack/react-query': 'commonjs @tanstack/react-query',
            'framer-motion': 'commonjs framer-motion'
          }
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