/**
 * ========================================
 * ROOT LAYOUT
 * ========================================
 * Server Component - Layout utama
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Penjualan - Skripsi',
  description: 'Aplikasi manajemen penjualan dan stok untuk skripsi',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}