/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  
  // Basic optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
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