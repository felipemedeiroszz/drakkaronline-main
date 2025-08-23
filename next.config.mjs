/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['ucarecdn.com'],
  },
  // Render.com compatibility
  output: 'standalone',
  // Fix Jest worker temporal dead zone error
  experimental: {
    esmExternals: false,
    turbo: {
      rules: {
        '*.js': {
          loaders: ['babel-loader'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Fix temporal dead zone issues in Jest worker
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        worker_threads: false,
        child_process: false,
      };
    }
    
    // Ensure proper variable scoping in compiled modules
    config.optimization = {
      ...config.optimization,
      usedExports: false,
      sideEffects: false,
    };
    
    return config;
  },
  // Disable caching for production
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

export default nextConfig