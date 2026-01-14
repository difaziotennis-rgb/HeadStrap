import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "E DiFazio Art | Contemporary Fine Art Portfolio",
  description: "Explore the contemporary fine art portfolio of E DiFazio. Discover original paintings, drawings, and mixed media works featuring vibrant compositions and expressive brushwork.",
  keywords: ["E DiFazio", "contemporary art", "fine art", "paintings", "art portfolio", "original artwork", "mixed media"],
  authors: [{ name: "E DiFazio" }],
  openGraph: {
    title: "E DiFazio Art | Contemporary Fine Art Portfolio",
    description: "Explore the contemporary fine art portfolio of E DiFazio. Discover original paintings, drawings, and mixed media works.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "E DiFazio Art",
    description: "Contemporary Fine Art Portfolio",
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
      <body>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

