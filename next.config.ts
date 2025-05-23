import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["placehold.co"]
  },

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
