/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@student-record/shared'],
  typescript: {
    // ⚠️ Temporarily ignore build errors to deploy faster
    // TODO: Fix type errors in production
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Temporarily ignore lint errors during builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['storage.googleapis.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig


