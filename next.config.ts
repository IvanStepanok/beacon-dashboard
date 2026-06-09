import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle (node .next/standalone/server.js) for container deploy.
  output: "standalone",
};

export default nextConfig;
