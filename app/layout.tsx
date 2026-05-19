import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learnify — Belajar Tanpa Batas",
  description: "Platform belajar online terbaik dengan ribuan materi eksklusif dari mentor terpilih.",
};

import { ToastProvider } from "@/components/ui/toast-provider";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <NextTopLoader
          color="#FF6B4A"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={true}
          easing="ease"
          speed={200}
          shadow="0 0 10px #FF6B4A,0 0 5px #FF6B4A"
        />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
