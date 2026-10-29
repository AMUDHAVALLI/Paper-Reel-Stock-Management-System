import type { Metadata, Viewport } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'OM Namasivayam Packaging | Paper Reel Stock Management ERP',
  description: 'Enterprise Corrugated Box & Paper Reel Inventory Management ERP. Puducherry Plant Capacity: 70–90 Tonnes/Month.',
};

export const viewport: Viewport = {
  themeColor: '#f8fafc',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light scroll-smooth">
      <body className="bg-slate-50 text-slate-800 antialiased selection:bg-amber-500/20 selection:text-amber-800">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

