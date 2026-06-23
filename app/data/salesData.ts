// app/data/salesData.ts

import type { SalesData } from '@/app/types';

export const salesData: SalesData = {
  hppPerPorsi: 13000,
  hargaJualPerPorsi: 15000,
  labaPerPorsi: 2000,
  targetHarian: 200,
  stokAwal: 500,
  thresholdBelanja: 200,
  
  realisasiHarian: [
    { 
      tanggal: '2026-06-17', 
      hari: 1,
      terjual: 200, 
      sisa: 300,
      stokAwal: 500,
      status: 'sisa banyak',
      perluBelanja: false,
      belanja: 0
    },
    { 
      tanggal: '2026-06-18', 
      hari: 2,
      terjual: 130, 
      sisa: 170,
      stokAwal: 300,
      status: 'sisa banyak',
      perluBelanja: false,
      belanja: 0
    },
    { 
      tanggal: '2026-06-19', 
      hari: 3,
      terjual: 130, 
      sisa: 40,
      stokAwal: 170,
      status: 'sisa sedikit',
      perluBelanja: true,
      belanja: 0
    },
    { 
      tanggal: '2026-06-20', 
      hari: 4,
      terjual: 200, 
      sisa: 140,
      stokAwal: 340,        // 40 + 300 belanja
      status: 'sisa banyak',
      perluBelanja: false,
      belanja: 300
    },
    { 
      tanggal: '2026-06-21', 
      hari: 5,
      terjual: 140,         // ← 140 (stok habis)
      sisa: 0,
      stokAwal: 140,
      status: 'habis',
      perluBelanja: true,
      belanja: 0
    },
    { 
      tanggal: '2026-06-22', 
      hari: 6,
      terjual: 0,           // ← 0 (stok habis, ga bisa jual)
      sisa: 0,
      stokAwal: 0,          // ← 0 (sisa dari kemarin 0)
      status: 'habis',
      perluBelanja: true,
      belanja: 0
    },
    { 
      tanggal: '2026-06-23', 
      hari: 7,
      terjual: 0,           // ← 0 (stok habis, ga bisa jual)
      sisa: 0,
      stokAwal: 0,          // ← 0 (sisa dari kemarin 0)
      status: 'habis',
      perluBelanja: true,
      belanja: 0
    },
  ],
  
  riwayatBelanja: [
    {
      tanggal: '2026-06-20',
      jumlah: 300,
      keterangan: 'Belanja stok karena sisa 40'
    }
  ],
};

// ✅ EXPORT calculateMetrics
export const calculateMetrics = (data: typeof salesData) => {
  const totalTerjual = data.realisasiHarian.reduce((sum, h) => sum + h.terjual, 0);
  const totalSisa = data.realisasiHarian.reduce((sum, h) => sum + h.sisa, 0);
  const totalBelanja = data.targetHarian * 7;
  const sisaBahanBaku = totalBelanja - totalTerjual;
  
  const totalPotensiHilang = totalSisa * data.hargaJualPerPorsi;
  const totalModalTerbuang = totalSisa * data.hppPerPorsi;
  
  return {
    totalTerjual,
    totalSisa,
    sisaBahanBaku,
    nilaiAset: sisaBahanBaku * data.hppPerPorsi,
    penjualanHariIni: data.realisasiHarian[data.realisasiHarian.length - 1].terjual,
    nilaiPenjualanHariIni: data.realisasiHarian[data.realisasiHarian.length - 1].terjual * data.hargaJualPerPorsi,
    totalProfit: totalTerjual * data.labaPerPorsi,
    persentaseEfisiensi: (totalTerjual / (data.targetHarian * 7)) * 100,
    totalPendapatan: totalTerjual * data.hargaJualPerPorsi,
    totalHPP: totalTerjual * data.hppPerPorsi,
    totalPotensiHilang,
    totalModalTerbuang,
  };
};