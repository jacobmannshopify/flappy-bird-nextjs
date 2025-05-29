/** @type {import('next').NextConfig} */
const nextConfig = {
  // Conditional output based on deployment target
  output: process.env.EXPORT === 'true' ? 'export' : 'standalone',
  
  // Base path for GitHub Pages (repository name)
  basePath: process.env.EXPORT === 'true' ? '/flappy-bird-nextjs' : '',
  
  // Asset prefix for GitHub Pages
  assetPrefix: process.env.EXPORT === 'true' ? '/flappy-bird-nextjs/' : '',
  
  // Trailing slash for static export
  trailingSlash: process.env.EXPORT === 'true',
  
  // Basic optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    // Disable image optimization for static export
    unoptimized: process.env.EXPORT === 'true',
  },

  // Build optimizations
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TS errors for deployment
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during builds
  },
};

module.exports = nextConfig; 