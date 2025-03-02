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
    // Optimize only for production client build
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 10000,
          maxSize: 20000000, // 20MB max chunk size
          cacheGroups: {
            default: false,
            vendors: false,
            // Extract large dependencies into separate chunks
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|next|@supabase)[\\/]/,
              priority: 40,
              chunks: 'all',
              enforce: true,
              maxSize: 20000000 // 20MB limit for framework chunks
            },
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
              maxSize: 20000000 // 20MB limit for lib chunks
            }
          }
        }
      };

      // Disable source maps in production
      config.devtool = false;

      // Configure webpack cache
      config.cache = {
        type: 'filesystem',
        version: '1.0.0',
        compression: 'gzip',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        buildDependencies: {
          config: [__filename]
        },
        cacheDirectory: '.next/cache/webpack'
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