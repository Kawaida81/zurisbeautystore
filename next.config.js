/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Keep your existing config options here
  swcMinify: true,
  reactStrictMode: true,
}

module.exports = nextConfig 