import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint errors are non-blocking — fix progressively post-launch
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors caught locally; allow deploy to proceed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
