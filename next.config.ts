import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.4', '10.149.3.60'],
  devIndicators: false,
  images: {
    qualities: [75, 95],
  },
};

export default nextConfig;
