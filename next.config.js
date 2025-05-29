/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone', // Optimize for deployment
  
  // Performance optimizations
  swcMinify: true, // Use SWC for minification (faster than Terser)
  
  // Compression and optimization
  compress: true,
  
  // Image optimizations
  images: {
    domains: [], // Add any external image domains here
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // PWA and caching optimizations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache game assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache API routes with shorter TTL
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600', // 1 hour
          },
        ],
      },
    ];
  },

  // Webpack optimizations for production
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production-specific optimizations
    if (!dev) {
      // Bundle analysis and optimization
      config.optimization = {
        ...config.optimization,
        
        // Advanced code splitting
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
            // Game-specific chunks
            game: {
              test: /[\\/](lib|components)[\\/]/,
              name: 'game',
              chunks: 'all',
              priority: 8,
            },
            // Audio system chunk
            audio: {
              test: /[\\/](audio|sound|music)[\\/]/,
              name: 'audio',
              chunks: 'all',
              priority: 7,
            },
          },
        },
        
        // Tree shaking and dead code elimination
        usedExports: true,
        sideEffects: false,
        
        // Module concatenation for smaller bundles
        concatenateModules: true,
      };

      // Add bundle analyzer for production insights
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: './bundle-analyzer-report.html',
          })
        );
      }

      // Performance optimizations
      config.performance = {
        ...config.performance,
        maxEntrypointSize: 512000, // 500KB
        maxAssetSize: 512000, // 500KB
      };

      // Add compression for production
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
          'process.env.GAME_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
        })
      );
    }

    // Custom loader for game assets
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: 'static/audio/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    return config;
  },

  // Experimental features for better performance
  experimental: {
    // Enable modern JavaScript features
    esmExternals: true,
    
    // Improve build performance
    swcTraceProfiling: process.env.NODE_ENV === 'production',
    
    // Runtime optimizations
    runtime: 'edge', // Use Edge Runtime for better performance where applicable
    
    // Memory optimizations
    workerThreads: true,
    
    // Bundle optimizations
    optimizeCss: true,
    
    // Server components optimizations (if using App Router)
    serverComponentsExternalPackages: ['canvas', 'sharp'],
  },

  // Environment-specific configurations
  env: {
    GAME_VERSION: process.env.npm_package_version || '1.0.0',
    BUILD_TIME: new Date().toISOString(),
    NODE_ENV: process.env.NODE_ENV,
  },

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Fast refresh for better development experience
    reactStrictMode: true,
    
    // Enhanced error overlay
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),

  // Production-only optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Disable source maps in production for smaller bundles
    productionBrowserSourceMaps: false,
    
    // Optimize fonts
    optimizeFonts: true,
    
    // Enable all React optimizations
    reactStrictMode: false, // Disable in production for performance
    
    // Build optimizations
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),

  // Asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Trailing slash handling
  trailingSlash: false,
  
  // Redirect handling for better SEO
  async redirects() {
    return [
      // Add any necessary redirects here
    ];
  },

  // Security headers
  poweredByHeader: false,
  
  // Generate static export if needed
  ...(process.env.EXPORT === 'true' && {
    output: 'export',
    distDir: 'dist',
    images: {
      unoptimized: true,
    },
  }),
};

module.exports = nextConfig; 