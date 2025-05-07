import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Updated import
import { GeistMono } from 'geist/font/mono'; // Updated import
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = GeistSans; // Direct assignment if variable font is default
const geistMono = GeistMono; // Direct assignment

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
