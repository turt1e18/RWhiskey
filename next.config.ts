import { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/main",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
