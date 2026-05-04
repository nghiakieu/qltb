import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only proxy API calls during development if explicitly needed
  async rewrites() {
    // In production (Vercel), we want to use Vercel's native /api handling or vercel.json
    // We should only use the proxy if we are running locally and want to connect to a separate backend
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
