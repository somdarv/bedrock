import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // react-pdf is a Node-only renderer (yoga/wasm); keep it out of the bundler.
  serverExternalPackages: ["@react-pdf/renderer"],
  experimental: {
    // Deliverable uploads go through a server action; allow real document sizes.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
