/**
 * ========================================
 * CUSTOM HOOK: useSalesData
 * ========================================
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { salesData as initialSalesData } from '@/app/data/salesData';  // ← PAKE INI
import type { 
  SalesData, 
  Metrics, 
  UseSalesDataReturn,
  RealisasiHarianItem,
  BelanjaItem
} from '@/app/types';

const getStatus = (sisa: number, threshold: number): 'habis' | 'sisa banyak' | 'sisa sedikit' | 'belum terjadi' => {
  if (sisa === 0) return 'habis';
  if (sisa < threshold) return 'sisa sedikit';
  return 'sisa banyak';
};

export function useSalesData(): UseSalesDataReturn {
  const [salesData, setSalesData] = useState<SalesData>(initialSalesData as any);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBelanjaOpen, setIsBelanjaOpen] = useState(false);

  const metrics = useMemo<Metrics>(() => {
    const { 
      hppPerPorsi, 
      hargaJualPerPorsi, 
      labaPerPorsi,
      targetHarian, 
      realisasiHarian,
      stokAwal,
      thresholdBelanja,
      riwayatBelanja
    } = salesData;
    
    if (!realisasiHarian || realisasiHarian.length === 0) {
      return {
        totalTerjual: 0,
        totalSisa: 0,
        sisaBahanBaku: 0,
        nilaiAset: 0,
        penjualanHariIni: 0,
        nilaiPenjualanHariIni: 0,
        totalProfit: 0,
        persentaseEfisiensi: 0,
        totalPendapatan: 0,
        totalHPP: 0,
        totalPotensiHilang: 0,
        totalModalTerbuang: 0,
        stokSaatIni: 0,
        perluBelanja: false,
        totalBelanja: 0
      };
    }

    // ========================================
    // TOTAL TERJUAL (akumulasi)
    // ========================================
    const totalTerjual = realisasiHarian.reduce(
      (sum, item) => sum + item.terjual, 
      0
    );
    
    // ========================================
    // AMBIL DATA HARI TERAKHIR
    // ========================================
    const hariTerakhir = realisasiHarian[realisasiHarian.length - 1];
    const penjualanHariIni = hariTerakhir?.terjual || 0;
    
    // ✅ TOTAL SISA = SISA HARI TERAKHIR (BUKAN AKUMULASI!)
    const totalSisa = hariTerakhir?.sisa || 0;
    const stokSaatIni = totalSisa;
    
    // ========================================
    // CEK PERLU BELANJA
    // ========================================
    const perluBelanja = stokSaatIni < thresholdBelanja;
    
    // ========================================
    // TOTAL BELANJA
    // ========================================
    const totalBelanja = riwayatBelanja.reduce(
      (sum, item) => sum + item.jumlah, 
      0
    );
    
    // ========================================
    // TOTAL PRODUKSI = STOK AWAL + BELANJA
    // ========================================
    const totalProduksi = stokAwal + totalBelanja;
    
    // ========================================
    // SISA BAHAN BAKU
    // ========================================
    const sisaBahanBaku = totalProduksi - totalTerjual;

    // ========================================
    // KEUANGAN
    // ========================================
    const totalPendapatan = totalTerjual * hargaJualPerPorsi;
    const totalHPP = totalTerjual * hppPerPorsi;
    const totalProfit = totalTerjual * labaPerPorsi;
    const nilaiPenjualanHariIni = penjualanHariIni * hargaJualPerPorsi;
    
    // ✅ POTENSI HILANG = SISA HARI TERAKHIR × HARGA JUAL
    const totalPotensiHilang = stokSaatIni * hargaJualPerPorsi;
    const totalModalTerbuang = stokSaatIni * hppPerPorsi;
    
    // ✅ NILAI ASET = SISA BAHAN BAKU × HPP (HARUSNYA POSITIF!)
    const nilaiAset = Math.max(0, sisaBahanBaku) * hppPerPorsi;
    
    // ✅ EFISIENSI = (TOTAL TERJUAL / TARGET TOTAL) × 100
    const targetTotal = targetHarian * realisasiHarian.length;
    const persentaseEfisiensi = targetTotal > 0 
      ? Number(((totalTerjual / targetTotal) * 100).toFixed(1))
      : 0;

    return {
      totalTerjual,           // 1.200
      totalSisa,              // 200 (sisa hari ke-7)
      sisaBahanBaku,          // sisa bahan baku
      nilaiAset,              // positif!
      penjualanHariIni,       // 170
      nilaiPenjualanHariIni,  // 2.550.000
      totalProfit,            // 2.400.000
      persentaseEfisiensi,    // 85.7 (BUKAN 150!)
      totalPendapatan,        // 18.000.000
      totalHPP,               // 15.600.000
      totalPotensiHilang,     // 3.000.000 (BUKAN 17.400.000!)
      totalModalTerbuang,     // 2.600.000
      stokSaatIni,            // 200
      perluBelanja,           // false
      totalBelanja,           // 300
    };
  }, [salesData]);

  // ========================================
  // UPDATE PENJUALAN
  // ========================================
  const updateTodaySales = useCallback((value: number): void => {
    try {
      if (value < 0) throw new Error('Nilai tidak boleh negatif');
      if (value > 9999) throw new Error('Nilai terlalu besar');

      const newSalesData = { ...salesData };
      const realisasi = [...newSalesData.realisasiHarian];
      
      const hariIni = realisasi[realisasi.length - 1];
      
      let sisaSebelumnya = 0;
      if (realisasi.length >= 2) {
        sisaSebelumnya = realisasi[realisasi.length - 2].sisa;
      } else {
        sisaSebelumnya = salesData.stokAwal;
      }
      
      const belanjaHariIni = salesData.riwayatBelanja
        .filter(item => item.tanggal === hariIni.tanggal)
        .reduce((sum, item) => sum + item.jumlah, 0);
      
      const stokTersedia = sisaSebelumnya + belanjaHariIni;
      const sisaHariIni = Math.max(0, stokTersedia - value);
      
      realisasi[realisasi.length - 1] = {
        ...hariIni,
        terjual: value,
        sisa: sisaHariIni,
        stokAwal: sisaSebelumnya + belanjaHariIni,
        perluBelanja: sisaHariIni < salesData.thresholdBelanja,
        status: getStatus(sisaHariIni, salesData.thresholdBelanja)
      };
      
      let stokBerjalan = salesData.stokAwal;
      const updatedRealisasi = realisasi.map((item, index) => {
        const belanjaDiHariIni = salesData.riwayatBelanja
          .filter(b => b.tanggal === item.tanggal)
          .reduce((sum, b) => sum + b.jumlah, 0);
        
        const stokTersediaItem = stokBerjalan + belanjaDiHariIni;
        const sisa = Math.max(0, stokTersediaItem - item.terjual);
        stokBerjalan = sisa;
        
        return {
          ...item,
          sisa,
          stokAwal: stokTersediaItem - item.terjual + sisa,
          perluBelanja: sisa < salesData.thresholdBelanja,
          status: getStatus(sisa, salesData.thresholdBelanja)
        };
      });
      
      setSalesData({
        ...newSalesData,
        realisasiHarian: updatedRealisasi
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Update gagal'));
      console.error('Error:', err);
    }
  }, [salesData]);

  // ========================================
  // TAMBAH BELANJA
  // ========================================
  const tambahBelanja = useCallback((jumlah: number, keterangan: string): void => {
    try {
      if (jumlah <= 0) throw new Error('Jumlah belanja harus lebih dari 0');

      const newSalesData = { ...salesData };
      
      const belanjaBaru: BelanjaItem = {
        tanggal: new Date().toISOString().split('T')[0],
        jumlah,
        keterangan: keterangan || 'Belanja stok'
      };
      
      newSalesData.riwayatBelanja = [...newSalesData.riwayatBelanja, belanjaBaru];
      
      const realisasi = [...newSalesData.realisasiHarian];
      const hariTerakhir = realisasi[realisasi.length - 1];
      
      if (hariTerakhir) {
        const sisaBaru = hariTerakhir.sisa + jumlah;
        realisasi[realisasi.length - 1] = {
          ...hariTerakhir,
          sisa: sisaBaru,
          perluBelanja: sisaBaru < salesData.thresholdBelanja,
          status: getStatus(sisaBaru, salesData.thresholdBelanja)
        };
        
        let stokBerjalan = salesData.stokAwal;
        const updatedRealisasi = realisasi.map((item, index) => {
          const belanjaDiHariIni = newSalesData.riwayatBelanja
            .filter(b => b.tanggal === item.tanggal)
            .reduce((sum, b) => sum + b.jumlah, 0);
          
          const stokTersediaItem = stokBerjalan + belanjaDiHariIni;
          const sisa = Math.max(0, stokTersediaItem - item.terjual);
          stokBerjalan = sisa;
          
          return {
            ...item,
            sisa,
            stokAwal: stokTersediaItem - item.terjual + sisa,
            perluBelanja: sisa < salesData.thresholdBelanja,
            status: getStatus(sisa, salesData.thresholdBelanja)
          };
        });
        
        newSalesData.realisasiHarian = updatedRealisasi;
      }
      
      setSalesData(newSalesData);
      setError(null);
      setIsBelanjaOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Belanja gagal'));
      console.error('Error:', err);
    }
  }, [salesData]);

  return {
    metrics,
    salesData,
    isFormOpen,
    setIsFormOpen,
    isBelanjaOpen,
    setIsBelanjaOpen,
    updateTodaySales,
    tambahBelanja,
    isLoading,
    error
  };
}