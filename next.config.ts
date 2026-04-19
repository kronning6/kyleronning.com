import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  cacheLife: {
    notion: {
      stale: 30,
      revalidate: 30,
      expire: 300,
    },
  },
  reactCompiler: true,
};

export default nextConfig;
