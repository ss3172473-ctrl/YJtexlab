import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deploys must not contain gated assets, including as traced server files.
  outputFileTracingExcludes: {
    "*": ["./swatches-media/**/*"],
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
      },
    ],
  },
};

export default nextConfig;
