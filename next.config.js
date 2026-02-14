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
  // Rewrite /strapped SPA routes to serve the static index.html
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy API calls to the LogicVault backend (configure LOGICVAULT_API_URL in Vercel env)
        {
          source: '/strapped/api/:path*',
          destination: `${process.env.LOGICVAULT_API_URL || 'https://logicvault-api-production.up.railway.app'}/api/:path*`,
        },
      ],
      afterFiles: [
        // Serve the SPA for all /strapped/* routes (non-asset paths)
        {
          source: '/strapped/:path((?!assets/).*)',
          destination: '/strapped/index.html',
        },
        // Serve /strapped itself
        {
          source: '/strapped',
          destination: '/strapped/index.html',
        },
      ],
    }
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
        './clover/**/*',
        './legal-clean-room/**/*',
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
            /clover/,
            /legal-clean-room/,
          ],
        }
      }
      return rule
    })
    
    return config
  },
}

module.exports = nextConfig

