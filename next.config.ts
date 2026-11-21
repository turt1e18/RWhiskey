import { NextConfig } from "next";

// 기본 보안 헤더(SEC-5). 스크립트를 제한하는 전체 CSP는 화면이 깨질 수 있어 넣지 않고, 다른 사이트의 iframe 삽입만 막는다.
// HSTS는 하위 도메인(API 등)에 영향을 주지 않게 includeSubDomains 를 빼 둔다.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
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
