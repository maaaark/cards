import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'riftmana.com',
        pathname: '/wp-content/uploads/Cards/**',
      },
    ],
  },
};

export default nextConfig;
