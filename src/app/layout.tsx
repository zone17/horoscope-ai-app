import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/animations.css";
import { CoreWebVitalsInitializer } from '@/components/performance/CoreWebVitalsInitializer';
import SchemaMarkupServer from '@/components/seo/SchemaMarkupServer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* Resource hints for improved performance */}
        <link rel="preconnect" href="https://api.gettodayshoroscope.com" />
        <link rel="dns-prefetch" href="https://api.gettodayshoroscope.com" />
        {/* Inject feature flags as global variables */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV_LUNAR_ORDER = ${JSON.stringify(lunarOrderEnabled)};`,
          }}
        />
        {/* Server-side schema markup */}
        <SchemaMarkupServer />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-indigo-950 via-[#0f0b30] to-[#0c0921] text-white`}
      >
        <CoreWebVitalsInitializer />
        {children}
      </body>
    </html>
  );
}
