import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Explicitly disable Turbopack to prevent module resolution failures in Firebase Cloud Functions
    turbo: undefined,
  },
};

export default nextConfig;
