// app/data/salesData.ts

export const salesData = {
  // Data harga
  hppPerPorsi: 13000,
  hargaJualPerPorsi: 15000,
  labaPerPorsi: 2000,
  targetHarian: 200,
  
  // Realisasi penjualan
  realisasiHarian: [
    { hari: 1, terjual: 200, sisa: 0 },
    { hari: 2, terjual: 130, sisa: 70 },
    { hari: 3, terjual: 130, sisa: 0 },
    { hari: 4, terjual: 200, sisa: 0 },
    { hari: 5, terjual: 200, sisa: 30 },
    { hari: 6, terjual: 170, sisa: 30 },
    { hari: 7, terjual: 170, sisa: 0 },
  ],
};

export const calculateMetrics = (data: typeof salesData) => {
  const totalTerjual = data.realisasiHarian.reduce((sum, h) => sum + h.terjual, 0);
  const totalSisa = data.realisasiHarian.reduce((sum, h) => sum + h.sisa, 0);
  const totalBelanja = data.targetHarian * 7;
  const sisaBahanBaku = totalBelanja - totalTerjual;
  
  // Hitung total kerugian potensial dari sisa stok
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
    totalPotensiHilang,      // Pendapatan yang hilang karena sisa
    totalModalTerbuang,      // Modal yang terbuang karena sisa
  };
};