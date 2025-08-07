import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    template: "%s | 데일리 바텐더",
    default: "데일리 바텐더 | 하루 한잔을 추천받는 서비스"
  },
  description: "한잔에 대해 고민일때 이용해보세요.",
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
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark bg-neutral-900 text-white`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
