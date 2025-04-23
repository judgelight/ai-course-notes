import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 构建时忽略ESLint错误，不会导致构建失败
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's.ar8.top',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
