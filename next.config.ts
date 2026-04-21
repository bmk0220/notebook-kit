import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly disable Turbopack as it causes issues with Firebase Cloud Function bundling
  experimental: {
    turbo: undefined, 
  },
};

export default nextConfig;
