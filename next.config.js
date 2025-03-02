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
  webpack: (config, { dev, isServer }) => {
    // Apply optimizations for both client and edge-server builds in production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 4000,
          maxSize: 12000000, // 12MB max chunk size
          cacheGroups: {
            default: false,
            vendors: false,
            // Core framework libraries
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              priority: 50,
              chunks: 'all',
              enforce: true,
              maxSize: 8000000 // 8MB limit
            },
            // Supabase related chunks
            supabase: {
              name: 'supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              priority: 45,
              chunks: 'all',
              maxSize: 8000000
            },
            // Common chunks
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
              maxSize: 8000000
            },
            // Styles
            styles: {
              name: 'styles',
              test: /\.(css|scss|sass)$/,
              chunks: 'all',
              enforce: true,
              maxSize: 6000000
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
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
              maxSize: 8000000
            }
          }
        }
      };

      // Disable source maps in production
      config.devtool = false;

      // Configure webpack cache with compression
      config.cache = {
        type: 'filesystem',
        version: '2.0.0', // Increment version to invalidate cache
        compression: 'brotli',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        buildDependencies: {
          config: [__filename]
        },
        cacheDirectory: '.next/cache/webpack',
        compression: {
          level: 11 // Maximum compression
        },
        name: isServer ? 'server' : 'client' // Separate caches for server and client
      };

      // Additional optimizations
      config.performance = {
        maxAssetSize: 12000000,
        maxEntrypointSize: 12000000,
        hints: 'warning'
      };
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