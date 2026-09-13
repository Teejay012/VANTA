import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three.js ships untranspiled ESM examples; keep the transpile list explicit.
  transpilePackages: ["three"],
};

export default nextConfig;
