// app/layout.tsx

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Menu items
  const menuItems = [
    { href: '/', label: '📊 Beranda / Dashboard', id: 'dashboard' },
    { href: '/master/product', label: '📦 Master Product', id: 'master-product' },
    { href: '/manage/penjualan', label: '💰 Penjualan', id: 'penjualan' },
    { href: '/manage/pembelian', label: '🛒 Pembelian', id: 'pembelian' },
    { href: '/manage/persediaan', label: '📦 Persediaan', id: 'persediaan' },
    { href: '/manage/asset', label: '🏦 Asset', id: 'asset' },
    { href: '/manage/laporan', label: '📄 Daftar Laporan', id: 'laporan' },
    { href: '/manage/karyawan', label: '👨‍💼 Karyawan & Gaji', id: 'karyawan' },
  ];

  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-gray-50 flex flex-col">
        {/* HEADER GLOBAL */}
        <header className="pt-4 pb-2 text-center border-b border-gray-100 bg-white shadow-sm sticky top-0 z-50">
          <h1 className="text-lg font-bold text-gray-700 tracking-wide" style={{ fontSize: '2rem' }}>
            SISTEM MANAJEMEN
          </h1>
          <p className="text-xs text-gray-400">Penjualan, Stok, & Karyawan</p>

          {/* Navigation Menu - Scrollable */}
          <div className="mt-3 flex justify-center overflow-x-auto px-4 gap-1 pb-2">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-1.5 text-base font-medium rounded-lg transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 bg-white pt-6">
          {children}
        </main>

        {/* FOOTER GLOBAL */}
        <footer className="py-4 text-center text-xs text-gray-300 border-t border-gray-100 bg-white">
          © 2026 Sistem Manajemen
        </footer>
      </body>
    </html>
  );
}