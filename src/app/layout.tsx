import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ApriFlow — Cash flow pribadi",
  description: "Cash flow pribadi lebih jelas, otomatis, dan terkontrol.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} bg-gray-50 text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
