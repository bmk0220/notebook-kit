import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notebook Kit | AI Marketplace & Forge",
  description: "Generate and discover professional NotebookLM-ready kits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
