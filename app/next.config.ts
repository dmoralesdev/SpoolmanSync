import type { NextConfig } from "next";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

const nextConfig: NextConfig = {
  output: 'standalone',
  // In addon mode, use relative asset paths so they resolve through HA ingress proxy
  assetPrefix: process.env.ADDON_BUILD === 'true' ? '.' : undefined,
  env: {
    APP_VERSION: pkg.version,
  },
};

export default nextConfig;
