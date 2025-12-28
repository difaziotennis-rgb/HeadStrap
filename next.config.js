/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.difaziotennis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'difaziotennis.com',
        pathname: '/**',
      },
    ],
  },
  // Skip static generation for admin dashboard to avoid Firebase build errors
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

