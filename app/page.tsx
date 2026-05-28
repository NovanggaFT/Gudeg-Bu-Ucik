// app/page.tsx

"use client";

import { useState } from "react";
import DashboardGrid from "@/app/components/dashboard/DashboardGrid";
import SalesTable from "@/app/components/dashboard/SalesTable";
import Button from "@/app/components/ui/Button";

export default function Home() {
  const [showTable, setShowTable] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header minimalis */}
      <div className="pt-12 pb-4 text-center">
        <h1 className="text-lg font-medium text-gray-400 tracking-wide">
          DASHBOARD
        </h1>
        <p className="text-xs text-gray-300 mt-1">
          manajemen penjualan & stok
        </p>
      </div>

      {/* Konten utama */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">  {/* ← ubah max-w-6xl jadi max-w-4xl karena 2 kolom */}
          {/* 4 Card dalam grid 2x2 */}
          <DashboardGrid />
          
          {/* Tombol Read More */}
          <div className="flex justify-center">
            <Button onClick={() => setShowTable(!showTable)} isOpen={showTable} />
          </div>
          
          {/* Tabel */}
          <div 
            className={`transition-all duration-500 overflow-hidden ${
              showTable ? "max-h-[600px] opacity-100 mt-8" : "max-h-0 opacity-0"
            }`}
          >
            <SalesTable />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center text-xs text-gray-300">
        data statis · periode mingguan
      </div>
    </main>
  );
}