import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Deliverable uploads go through a server action; allow real document sizes.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
