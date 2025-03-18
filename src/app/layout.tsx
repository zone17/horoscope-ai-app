import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cosmic Insights - Daily Horoscope for Mindful Living",
  description: "Get daily horoscope guidance for mindful, spiritual reflection and self-awareness rather than predictions.",
  keywords: "horoscope, mindfulness, spiritual reflection, zodiac, self-awareness, daily guidance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 min-h-screen transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}
