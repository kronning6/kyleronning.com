import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  cacheLife: {
    notion: {
      stale: 60 * 60 * 24 * 30,
      revalidate: 60 * 60 * 24 * 365,
      expire: 60 * 60 * 24 * 365 * 2,
    },
  },
  reactCompiler: true,
};

export default nextConfig;
