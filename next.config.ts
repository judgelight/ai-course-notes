import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.ar8.top",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
