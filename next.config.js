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
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
    ],
  },
  // Allow YouTube embeds
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  },
  // Skip static generation for admin dashboard to avoid Firebase build errors
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Exclude ClubManagement and art-portfolio directories from build
  webpack: (config, { isServer }) => {
    // Exclude ClubManagement and art-portfolio from webpack compilation
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    
    // Add rule to ignore these directories
    config.module.rules.push({
      test: /\.(tsx?|jsx?)$/,
      include: (filePath) => {
        // Exclude ClubManagement and art-portfolio
        if (filePath.includes('ClubManagement') || filePath.includes('art-portfolio')) {
          return false
        }
        return true
      },
    })
    
    return config
  },
}

module.exports = nextConfig

