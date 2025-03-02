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
          minSize: 20000,
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
              enforce: true
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
              reuseExistingChunk: true
            }
          }
        }
      };

      // Disable source maps in production
      config.devtool = false;
    }

    return config;
  }
}

module.exports = nextConfig 