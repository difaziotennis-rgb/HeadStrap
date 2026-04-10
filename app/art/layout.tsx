import type { Metadata } from "next";

import { ArtChrome } from "@/components/art/ArtChrome";
import { ART_SITE } from "@/lib/art/site";

import { artSiteFont } from "./fonts";

const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  "https://difaziotennis.com";

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
    canonical: "/art",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    url: "/art",
    title: ART_SITE.siteTitle,
    description: ART_SITE.tagline,
    type: "website",
    locale: "en_US",
  },
  /** Overrides root layout’s placeholder Twitter card so shares/previews match the art site. */
  twitter: {
    card: "summary_large_image",
    title: ART_SITE.siteTitle,
    description: ART_SITE.tagline,
  },
};

export default function ArtLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${artSiteFont.className} text-[15px] font-light leading-[1.87] text-mcm-charcoal-800 antialiased`}
    >
      <ArtChrome>{children}</ArtChrome>
    </div>
  );
}
