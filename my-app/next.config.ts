import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // E2E team build writes to dist-team (scripts/build-team-e2e.mjs)
  distDir: process.env.NEXT_DIST_DIR || 'dist',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
