import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  themeColor: '#d54d69',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://notebookkit.com'),
  title: "Notebook Kit | AI Knowledge Marketplace",
  description: "Discover and collect professional NotebookLM-ready source kits.",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "Notebook Kit | AI Knowledge Marketplace",
    description: "Discover and collect professional NotebookLM-ready source kits.",
    url: 'https://notebookkit.com',
    siteName: 'Notebook Kit',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Notebook Kit | AI Knowledge Marketplace",
    description: "Discover and collect professional NotebookLM-ready source kits.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
