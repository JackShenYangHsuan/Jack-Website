import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode to prevent double-render in development
  // This prevents duplicate API calls when clicking buttons
  reactStrictMode: false,
};

export default nextConfig;
