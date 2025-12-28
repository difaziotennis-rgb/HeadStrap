import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DiFazio Tennis - Private Lessons | Rhinebeck Tennis Club",
  description: "Book private tennis lessons with DiFazio Tennis at Rhinebeck Tennis Club. Professional instruction in the heart of the Hudson Valley.",
  keywords: ["tennis lessons", "private tennis", "Rhinebeck Tennis Club", "Hudson Valley tennis", "tennis coaching", "DiFazio Tennis"],
  authors: [{ name: "DiFazio Tennis" }],
  openGraph: {
    title: "DiFazio Tennis - Private Lessons | Rhinebeck Tennis Club",
    description: "Book private tennis lessons with DiFazio Tennis at Rhinebeck Tennis Club. Professional instruction in the heart of the Hudson Valley.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "DiFazio Tennis - Private Lessons",
    description: "Book private tennis lessons at Rhinebeck Tennis Club",
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






