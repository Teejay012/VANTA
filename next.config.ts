import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Editorial imagery is generated with Higgsfield and served from their CDN.
    remotePatterns: [
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
    ],
  },
  // three.js ships untranspiled ESM examples; keep the transpile list explicit.
  transpilePackages: ["three"],
};

export default nextConfig;
