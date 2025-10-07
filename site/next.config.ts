import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Allow explicit quality values used across the app
    qualities: [85, 90, 92],
  },
};

export default nextConfig;
