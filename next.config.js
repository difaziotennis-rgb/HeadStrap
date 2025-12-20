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
}

module.exports = nextConfig

