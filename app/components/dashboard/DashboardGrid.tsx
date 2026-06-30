// app/components/dashboard/DashboardGrid.tsx

'use client';

import { useMemo } from 'react';
import StatCardGrid from './StatCardGrid';
import SalesChart from './SalesChart';
import PenjualanTable from './PenjualanTable';
import FilterBar from '../manage/FilterBar';
import { getDashboardCards } from '@/app/config/cards';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

interface Metrics {
  totalTerjual: number;
  totalSisa: number;
  sisaBahanBaku: number;
  nilaiAset: number;
  penjualanHariIni: number;
  nilaiPenjualanHariIni: number;
  totalProfit: number;
  persentaseEfisiensi: number;
  totalPendapatan: number;
  totalHPP: number;
  totalPotensiHilang: number;
  totalModalTerbuang: number;
  stokSaatIni: number;
  perluBelanja: boolean;
  totalBelanja: number;
}

interface DashboardGridProps {
  metrics: Metrics;
  onOpenForm: () => void;
  onOpenBelanja: () => void;
  showTable: boolean;
  onToggleTable: () => void;
  tableData: any[];
  chartData: any[];
  targetHarian: number;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  currentWeek: number;
  onWeekChange: (week: number) => void;
  onFilterChange: (start: string, end: string) => void;
}

export default function DashboardGrid({ 
  metrics, 
  onOpenForm, 
  onOpenBelanja,
  showTable,
  onToggleTable,
  tableData,
  chartData,
  targetHarian,
  hppPerPorsi,
  hargaJualPerPorsi,
  labaPerPorsi,
  currentWeek,
  onWeekChange,
  onFilterChange,
}: DashboardGridProps) {
  
  // ✅ Panggil getDashboardCards
  const cards = useMemo(
    () => getDashboardCards(metrics, targetHarian),
    [metrics, targetHarian]
  );

  return (
    <div>
      {/* Filter */}
      <FilterBar
        currentWeek={currentWeek}
        onWeekChange={onWeekChange}
        onFilterChange={onFilterChange}
      />

      {/* Stat Cards */}
      <StatCardGrid cards={cards} className="mt-6" />

      {/* Chart */}
      <div className="mt-6">
        <SalesChart
          data={chartData}
          title="📊 Grafik Penjualan & Pembelian"
          height={350}
        />
      </div>
      
      {/* Tombol Actions */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        <button
          onClick={onOpenForm}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Input Penjualan
        </button>
        <button
          onClick={onOpenBelanja}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Belanja Stok
        </button>
        <button
          onClick={onToggleTable}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showTable ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
          {showTable ? 'Sembunyikan Tabel' : 'Lihat Tabel'}
        </button>
      </div>

      {/* Tabel Penjualan (toggle) */}
      <div
        className={`
          transition-all duration-500 overflow-hidden
          ${showTable ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!showTable}
      >
        <PenjualanTable
          data={tableData}
          targetHarian={targetHarian}
          hppPerPorsi={hppPerPorsi}
          hargaJualPerPorsi={hargaJualPerPorsi}
          labaPerPorsi={labaPerPorsi}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}