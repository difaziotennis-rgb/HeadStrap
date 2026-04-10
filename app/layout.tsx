import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Removed",
  description: "This website has been removed.",
  keywords: ["website removed"],
  authors: [{ name: "Site Owner" }],
  openGraph: {
    title: "Website Removed",
    description: "This website has been removed.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Website Removed",
    description: "This website has been removed.",
  },
  robots: {
    index: false,
    follow: false,
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






