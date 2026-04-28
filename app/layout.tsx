import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Notebook Kit | AI Knowledge Marketplace",
  description: "Discover and collect professional NotebookLM-ready source kits.",
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
