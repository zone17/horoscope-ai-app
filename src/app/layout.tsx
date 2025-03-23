import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/animations.css";
import CoreWebVitalsOptimizer from "@/components/performance/CoreWebVitalsOptimizer";
import WebVitalsMonitor from "@/components/performance/WebVitalsMonitor";
import { isFeatureEnabled, FEATURE_FLAGS } from "@/utils/feature-flags";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Core Web Vitals optimization - prevents FOIT
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Core Web Vitals optimization - prevents FOIT
});

export const metadata: Metadata = {
  title: "Today's Horoscope - Daily Celestial Guidance",
  description: "Get daily horoscope guidance for mindful, spiritual reflection and self-awareness rather than predictions.",
  keywords: "horoscope, mindfulness, spiritual reflection, zodiac, self-awareness, daily guidance",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get environment variables for feature flags
  const lunarOrderEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_LUNAR_ZODIAC_ORDER === 'true';
  const coreWebVitalsEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG_USE_CORE_WEB_VITALS_OPTIMIZATIONS === 'true';
  
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* Inject feature flags as global variables */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ENV_LUNAR_ORDER = ${JSON.stringify(lunarOrderEnabled)};
              window.ENV_CORE_WEB_VITALS = ${JSON.stringify(coreWebVitalsEnabled)};
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-indigo-950 via-[#0f0b30] to-[#0c0921] text-white`}
      >
        {/* Only include the Core Web Vitals components if the feature flag is enabled */}
        {coreWebVitalsEnabled ? (
          <>
            <CoreWebVitalsOptimizer>
              {children}
            </CoreWebVitalsOptimizer>
            <WebVitalsMonitor />
          </>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
