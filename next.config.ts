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
  },

  async rewrites() {
    // 로컬 개발 환경에서 CORS 문제를 피하기 위한 프록시 설정
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8080/api/:path*"
        }
      ];
    }
    return [];
  }
};

export default nextConfig;
