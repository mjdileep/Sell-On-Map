import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "SellOnMap — Buy & Sell Near You",
    template: "%s | SellOnMap",
  },
  description: "SellOnMap is a map-first classifieds marketplace to buy and sell items and properties near you.",
  manifest: "/manifest.webmanifest",
  themeColor: "#0ea5e9",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg" }],
  },
  openGraph: {
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "SellOnMap",
    title: "SellOnMap — Buy & Sell Near You",
    description: "Map-first classifieds marketplace.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "SellOnMap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SellOnMap — Buy & Sell Near You",
    description: "Map-first classifieds marketplace.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
