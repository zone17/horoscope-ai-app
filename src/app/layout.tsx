import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/animations.css";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-indigo-950 via-[#0f0b30] to-[#0c0921] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
