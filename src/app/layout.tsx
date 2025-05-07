
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Removed as it's no longer applied to body globally. Import if used elsewhere.
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Removed redundant const declarations:
// const geistSans = GeistSans;
// const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'SwiftStock - Sales & Inventory',
  description: 'Modern sales and inventory management application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${GeistSans.className} antialiased`} 
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
