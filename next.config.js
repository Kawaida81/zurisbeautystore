const webpack = require('webpack');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: 'standalone',
  swcMinify: true,
  env: {
    NEXT_PUBLIC_RUNTIME: 'browser',
  },
  experimental: {
    serverActions: true,
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      'date-fns',
      'lucide-react',
      'framer-motion',
      '@hookform/resolvers',
      '@tanstack/react-query'
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Polyfill fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
    };

    // Only minimize client bundles in production
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        minimize: true,
        minimizer: [
          ...config.optimization.minimizer || [],
        ],
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 100000,
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
            lib: {
              test(module) {
                return (
                  module.size() > 50000 &&
                  /node_modules[/\\]/.test(module.identifier())
                );
              },
              name(module) {
                const match = module.identifier().match(/node_modules[/\\](.*?)([/\\]|$)/);
                const name = match ? match[1].replace(/[@.]/g, '_') : 'lib';
                return `lib-${name.substring(0, 30)}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            styles: {
              name: 'styles',
              test: /\.(css|scss|sass)$/,
              chunks: 'all',
              enforce: true,
              priority: 50,
            },
            images: {
              name: 'images',
              test: /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
              chunks: 'all',
              priority: 45,
            },
          },
        },
      };

      // Enable tree shaking
      config.optimization.usedExports = true;
    }

    // Performance hints
    config.performance = {
      ...config.performance,
      maxEntrypointSize: 500000,
      maxAssetSize: 500000,
      hints: !dev ? 'warning' : false,
    };

    // Server-specific settings
    if (isServer) {
      config.output = {
        ...config.output,
        webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
      };

      // Handle server-side packages
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }, callback) => {
          if (['@supabase/supabase-js', '@tanstack/react-query', 'next-auth', 'jose', 'framer-motion', 'date-fns'].includes(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
    }

    return config;
  },
  // Disable powered by header
  poweredByHeader: false,
  // Adjust onDemandEntries
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig 