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
    // Exclude ClubManagement and art-portfolio from output file tracing
    outputFileTracingExcludes: {
      '*': [
        './ClubManagement/**/*',
        './art-portfolio/**/*',
      ],
    },
  },
  // Exclude ClubManagement and art-portfolio directories from build
  webpack: (config) => {
    // Exclude ClubManagement and art-portfolio from module resolution
    const originalResolveLoader = config.resolveLoader || {}
    config.resolveLoader = {
      ...originalResolveLoader,
      modules: [
        ...(originalResolveLoader.modules || ['node_modules']),
      ],
    }
    
    // Add rule to exclude these directories
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    
    // Override the default rule to exclude ClubManagement and art-portfolio
    config.module.rules = config.module.rules.map((rule) => {
      if (rule.test && (rule.test.toString().includes('tsx?') || rule.test.toString().includes('jsx?'))) {
        return {
          ...rule,
          exclude: [
            ...(Array.isArray(rule.exclude) ? rule.exclude : rule.exclude ? [rule.exclude] : []),
            /ClubManagement/,
            /art-portfolio/,
          ],
        }
      }
      return rule
    })
    
    return config
  },
}

module.exports = nextConfig

