import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${apiUrl.replace('/api', '')}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
