// app/config/cards.ts

import { CardItem } from '@/app/components/dashboard/StatCardGrid';
import { AsetIcon, PenjualanIcon, ProfitIcon, EfisiensiIcon } from '@/app/components/icons/DashboardIcons';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

interface Metrics {
  nilaiAset: number;
  sisaBahanBaku: number;
  nilaiPenjualanHariIni: number;
  penjualanHariIni: number;
  totalProfit: number;
  totalTerjual: number;
  persentaseEfisiensi: number;
  totalSisa: number;
}

export function getDashboardCards(metrics: Metrics, targetHarian: number): CardItem[] {
  return [
    {
      id: 1,
      title: "NILAI ASET",
      value: formatRupiah(metrics.nilaiAset),
      subtitle: `${metrics.sisaBahanBaku} porsi bahan baku`,
      color: "aset" as const,
      link: "/manage/pembelian",
      icon: <AsetIcon />, // ✅ JSX element (bukan komponen)
    },
    {
      id: 2,
      title: "PENJUALAN HARI INI",
      value: formatRupiah(metrics.nilaiPenjualanHariIni),
      subtitle: `${metrics.penjualanHariIni} porsi terjual`,
      color: "penjualan" as const,
      link: "/manage/penjualan",
      icon: <PenjualanIcon />,
    },
    {
      id: 3,
      title: "PROFIT MINGGUAN",
      value: formatRupiah(metrics.totalProfit),
      subtitle: `${metrics.totalTerjual} porsi dari ${targetHarian * 7} target`,
      color: "profit" as const,
      link: "/manage/penjualan",
      icon: <ProfitIcon />,
    },
    {
      id: 4,
      title: "EFISIENSI",
      value: `${metrics.persentaseEfisiensi.toFixed(1)}%`,
      subtitle: `Sisa stok: ${metrics.totalSisa} porsi`,
      color: "efisiensi" as const,
      link: "/manage/penjualan",
      icon: <EfisiensiIcon />,
    },
  ];
}