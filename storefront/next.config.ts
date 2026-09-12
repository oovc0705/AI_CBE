import type { NextConfig } from "next";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8081";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: `${AI_SERVICE_URL}/api/:path*`,
      },
      {
        source: "/api/storefront/:path*",
        destination: `${API_BASE_URL}/api/storefront/:path*`,
      },
      {
        source: "/api/health",
        destination: `${API_BASE_URL}/api/health`,
      },
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/shipping-policy', destination: '/policies/shipping-policy', permanent: true },
      { source: '/refund-policy', destination: '/policies/refund-policy', permanent: true },
      { source: '/terms-of-service', destination: '/policies/terms-of-service', permanent: true },
    ];
  },
};

export default nextConfig;