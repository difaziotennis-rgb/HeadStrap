import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DiFazio Tennis",
  description: "Book tennis lessons with Coach Derek DiFazio — Rhinebeck, NY.",
  keywords: [
    "DiFazio Tennis",
    "tennis lessons",
    "Rhinebeck",
    "Hudson Valley",
    "Coach Derek DiFazio",
  ],
  authors: [{ name: "Derek DiFazio" }],
  openGraph: {
    title: "DiFazio Tennis",
    description: "Book tennis lessons — Rhinebeck, NY",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DiFazio Tennis",
    description: "Book tennis lessons — Rhinebeck, NY",
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






