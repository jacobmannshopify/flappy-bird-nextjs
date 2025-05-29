import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flappy Bird - Professional HTML5 Game | Play Now",
  description: "Experience the ultimate Flappy Bird recreation with 6 game modes, achievements, social sharing, and enterprise-grade performance. Built with Next.js and TypeScript. Play instantly in your browser!",
  keywords: ["flappy bird", "html5 game", "browser game", "nextjs game", "online game", "mobile game", "web game"],
  authors: [{ name: "Jacob Mann" }],
  creator: "Jacob Mann",
  publisher: "Jacob Mann",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flappy Bird Pro",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flappy-bird-nextjs-iqrr2t3hh-jacobs-projects-d4825c0d.vercel.app",
    siteName: "Flappy Bird Pro",
    title: "Flappy Bird - Professional HTML5 Game | Play Now",
    description: "The ultimate Flappy Bird experience with 6 game modes, achievements, power-ups, and social sharing. Enterprise-grade performance meets classic gameplay. Play instantly!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flappy Bird Pro - Professional HTML5 Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flappy Bird - Professional HTML5 Game",
    description: "Ultimate Flappy Bird with 6 modes, achievements & social sharing. Play now!",
    images: ["/og-image.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "msapplication-TileColor": "#32CD32",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#32CD32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="google" content="notranslate" />
      </head>
      <body className="antialiased bg-gradient-to-b from-sky-300 to-sky-500 min-h-screen">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoGame",
              "name": "Flappy Bird Pro",
              "description": "Professional Flappy Bird recreation with advanced features",
              "genre": ["Action", "Arcade"],
              "gamePlatform": ["Web", "Mobile", "Desktop"],
              "operatingSystem": ["Web Browser"],
              "applicationCategory": "Game",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </body>
    </html>
  );
}
