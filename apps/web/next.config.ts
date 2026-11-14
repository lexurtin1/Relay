import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@relay/core", "@relay/connectors"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
