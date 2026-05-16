import type { Metadata } from "next";
import localFont from "next/font/local";
import { Parisienne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "@/app/globals.css";
import AuthProvider from "@/components/AuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900"
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900"
});

const kyobo = localFont({
  src: "./fonts/KyoboHandwriting2024psw.ttf",
  variable: "--font-kyobo"
});

const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-parisienne"
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://your-production-url.com" // 실제 배포 시 도메인으로 변경 필요
      : "http://localhost:3000"
  ),
  title: {
    template: "%s | 데일리 바텐더",
    default: "데일리 바텐더 | 하루 한잔을 추천받는 서비스"
  },
  description: "하루를 장식할 한잔에 대해 고민이 생기면 이용해보세요.",
  openGraph: {
    siteName: "데일리 바텐더",
    images: {
      url: "/doom.png"
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta
          name="description"
          content="하루를 장식할 한잔에 대해 고민이 생기면 이용해보세요."
        ></meta>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kyobo.variable} ${parisienne.variable} antialiased dark bg-neutral-900 text-white`}
      >
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="top-center" richColors />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
