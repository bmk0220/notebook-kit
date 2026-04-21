import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable Turbopack to prevent module resolution failures in Firebase Cloud Functions
  experimental: {
    turbo: undefined,
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
