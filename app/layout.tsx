import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E. DiFazio Art",
  description: "Art washes away the dust of everyday life — Ellen DiFazio, Hilton Head Island.",
  keywords: ["Ellen DiFazio", "Hilton Head art", "Lowcountry paintings"],
  authors: [{ name: "Ellen DiFazio" }],
  openGraph: {
    title: "E. DiFazio Art",
    description: "Art washes away the dust of everyday life",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "E. DiFazio Art",
    description: "Art washes away the dust of everyday life",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}






