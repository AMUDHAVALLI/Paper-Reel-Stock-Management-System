import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Paper Reel Stock Management | Om Namasivayam Packaging',
  description: 'Industrial Paper Reel Stock & Inventory Management ERP for Corrugated Box Packaging. Track Kraft Reels, GSM, Deckle Sizes, Burst Factor, Partial Consumption and Stock Valuations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0d14] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-300">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
