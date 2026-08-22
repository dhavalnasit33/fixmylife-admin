import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing config
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // ✅ Disable Turbopack explicitly
  experimental: {
    turbo: {},
  },
};

export default nextConfig;
