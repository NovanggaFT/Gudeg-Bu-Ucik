// app/components/dashboard/DashboardGrid.tsx

import StatCard from "./StatCard";
import { calculateMetrics } from "@/app/data/salesData";  // ✅ IMPORT calculateMetrics

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

interface DashboardGridProps {
  metrics: ReturnType<typeof calculateMetrics>;
  onOpenForm: () => void;
  onOpenBelanja: () => void;  // ← TAMBAHKAN INI
}

export default function DashboardGrid({ metrics, onOpenForm, onOpenBelanja }: DashboardGridProps) {
  
  const cards = [
    {
      id: 1,
      title: "NILAI ASET",
      value: formatRupiah(metrics.nilaiAset),
      subtitle: `${metrics.sisaBahanBaku} porsi bahan baku`,
      color: "aset" as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "PENJUALAN HARI INI",
      value: formatRupiah(metrics.nilaiPenjualanHariIni),
      subtitle: `${metrics.penjualanHariIni} porsi terjual`,
      color: "penjualan" as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 18v3" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "PROFIT MINGGUAN",
      value: formatRupiah(metrics.totalProfit),
      subtitle: `${metrics.totalTerjual} porsi dari 1.400 target`,
      color: "profit" as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 4,
      title: "EFISIENSI",
      value: `${metrics.persentaseEfisiensi.toFixed(1)}%`,
      subtitle: `Sisa stok: ${metrics.totalSisa} porsi`,
      color: "efisiensi" as const,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {cards.map((card) => (
          <StatCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>
      
      {/* Tombol Actions */}
      <div className="flex justify-center gap-3 mt-8">
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
      </div>
    </div>
  );
}