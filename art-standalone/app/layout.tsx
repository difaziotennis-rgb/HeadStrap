import type { Metadata } from "next";

import { ArtChrome } from "@/components/art/ArtChrome";
import { ART_SITE } from "@/lib/art/site";

import { artSiteFont } from "./fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://edifazioart.net";

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: {
    default: ART_SITE.siteTitle,
    template: `%s · ${ART_SITE.siteTitle}`,
  },
  description: `${ART_SITE.tagline} · ${ART_SITE.artistName}, Hilton Head Island.`,
  keywords: [
    "Ellen DiFazio",
    "Hilton Head art",
    "Lowcountry paintings",
    "E. DiFazio Art",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: "/",
    title: ART_SITE.siteTitle,
    description: ART_SITE.tagline,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: ART_SITE.siteTitle,
    description: ART_SITE.tagline,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${artSiteFont.className} text-[15px] font-light leading-[1.87] text-mcm-charcoal-900 antialiased`}
      >
        <div data-art-site>
          <ArtChrome>{children}</ArtChrome>
        </div>
      </body>
    </html>
  );
}
