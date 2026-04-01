import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "../styles/animations.css";
import { CoreWebVitalsInitializer } from '@/components/performance/CoreWebVitalsInitializer';
import SchemaMarkupServer from '@/components/seo/SchemaMarkupServer';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Today's Horoscope — Daily Philosophical Guidance",
  description: "Every morning, a philosopher looks through your sign and says the one thing you needed to hear. Daily readings grounded in Seneca, Epictetus, and Feynman.",
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0C0B1E" />
        {/* Resource hints for improved performance */}
        <link rel="preconnect" href="https://api.gettodayshoroscope.com" />
        <link rel="dns-prefetch" href="https://api.gettodayshoroscope.com" />
        {/* Inject feature flags as global variables */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV_LUNAR_ORDER = ${JSON.stringify(lunarOrderEnabled)};`,
          }}
        />
        {/* Ahrefs Web Analytics */}
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="d8iBwaSm9yiczOTx1CK83A" async />
        {/* Server-side schema markup */}
        <SchemaMarkupServer />
      </head>
      <body
        className={`${playfairDisplay.variable} antialiased min-h-screen bg-gradient-to-br from-indigo-950 via-[#0f0b30] to-[#0c0921] text-white`}
      >
        <CoreWebVitalsInitializer />
        {children}
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
