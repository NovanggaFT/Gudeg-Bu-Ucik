// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import DashboardGrid from '@/app/components/dashboard/DashboardGrid';
import PenjualanForm from '@/app/components/form/PenjualanForm';
import PembelianForm from '@/app/components/form/PembelianForm';
import { getMasterByDate } from '@/app/lib/master';

interface SalesData {
  id: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  tanggalBerlaku: string;
  realisasi: Array<{
    id: string;
    tanggal: string;
    terjual: number;
    sisa: number;
    stokAwal: number;
    status: string;
    perluBelanja: boolean;
    hppPerPorsi: number;
    hargaJualPerPorsi: number;
    labaPerPorsi: number;
    targetHarian: number;
    thresholdBelanja: number;
  }>;
  riwayatBelanja: Array<{
    id: string;
    tanggal: string;
    jumlah: number;
    jumlahSystem: number | null;
    total: number | null;
    totalSystem: number | null;
    hppPerPorsi: number;
    keterangan: string | null;
  }>;
}

export default function Home() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBelanjaOpen, setIsBelanjaOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [activeMaster, setActiveMaster] = useState<any>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/penjualan');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setSalesData(result.data);
        setActiveMaster(result.activeMaster);
        
        // Set filtered data awal
        const tableData = result.data.realisasi.map((r: any) => ({
          id: r.id,
          tanggal: r.tanggal,
          hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
          terjual: r.terjual,
          sisa: r.sisa,
          stokAwal: r.stokAwal,
          status: r.status,
          perluBelanja: r.perluBelanja,
          // Snapshot data
          hppPerPorsi: r.hppPerPorsi || result.data.hppPerPorsi,
          hargaJualPerPorsi: r.hargaJualPerPorsi || result.data.hargaJualPerPorsi,
          labaPerPorsi: r.labaPerPorsi || result.data.labaPerPorsi,
          targetHarian: r.targetHarian || result.data.targetHarian,
          thresholdBelanja: r.thresholdBelanja || result.data.thresholdBelanja,
        }));
        setFilteredData(tableData);
      } else {
        setError(result.error || 'Gagal mengambil data');
      }
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter handler
  const handleFilterChange = (startDate: string, endDate: string) => {
    if (!salesData) return;
    
    const filtered = salesData.realisasi.filter((item) => {
      const date = item.tanggal.split('T')[0];
      return date >= startDate && date <= endDate;
    });

    setFilteredData(filtered.map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
      terjual: r.terjual,
      sisa: r.sisa,
      stokAwal: r.stokAwal,
      status: r.status,
      perluBelanja: r.perluBelanja,
      hppPerPorsi: r.hppPerPorsi || salesData.hppPerPorsi,
      hargaJualPerPorsi: r.hargaJualPerPorsi || salesData.hargaJualPerPorsi,
      labaPerPorsi: r.labaPerPorsi || salesData.labaPerPorsi,
      targetHarian: r.targetHarian || salesData.targetHarian,
      thresholdBelanja: r.thresholdBelanja || salesData.thresholdBelanja,
    })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !salesData || !activeMaster) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>❌ {error || 'Data tidak ditemukan'}</p>
          <p className="text-sm text-gray-400 mt-2">Pastikan ada master yang aktif</p>
        </div>
      </div>
    );
  }

  // Hitung metrics dari filtered data
  const totalTerjual = filteredData.reduce((sum, h) => sum + h.terjual, 0);
  const totalSisa = filteredData.length > 0 ? filteredData[filteredData.length - 1]?.sisa || 0 : 0;
  
  // Hitung total belanja
  const totalBelanja = salesData.riwayatBelanja.reduce((sum, b) => {
    const jumlah = b.jumlah || b.jumlahSystem || 0;
    return sum + jumlah;
  }, 0);
  
  // ✅ PAKAI SNAPSHOT DARI DATA (bukan dari master)
  const hppPerPorsi = filteredData.length > 0 
    ? filteredData[filteredData.length - 1]?.hppPerPorsi || salesData.hppPerPorsi 
    : salesData.hppPerPorsi;
  const hargaJualPerPorsi = filteredData.length > 0 
    ? filteredData[filteredData.length - 1]?.hargaJualPerPorsi || salesData.hargaJualPerPorsi 
    : salesData.hargaJualPerPorsi;
  const labaPerPorsi = filteredData.length > 0 
    ? filteredData[filteredData.length - 1]?.labaPerPorsi || salesData.labaPerPorsi 
    : salesData.labaPerPorsi;
  const targetHarian = filteredData.length > 0 
    ? filteredData[filteredData.length - 1]?.targetHarian || salesData.targetHarian 
    : salesData.targetHarian;

  const totalPendapatan = totalTerjual * hargaJualPerPorsi;
  const totalHPP = totalTerjual * hppPerPorsi;
  const totalProfit = totalTerjual * labaPerPorsi;
  const totalPotensiHilang = totalSisa * hargaJualPerPorsi;
  const persentaseEfisiensi = filteredData.length > 0 
    ? (totalTerjual / (targetHarian * filteredData.length)) * 100 
    : 0;

  const metrics = {
    totalTerjual,
    totalSisa,
    sisaBahanBaku: (salesData.stokAwal + totalBelanja) - totalTerjual,
    nilaiAset: ((salesData.stokAwal + totalBelanja) - totalTerjual) * hppPerPorsi,
    penjualanHariIni: filteredData.length > 0 ? filteredData[filteredData.length - 1]?.terjual || 0 : 0,
    nilaiPenjualanHariIni: (filteredData.length > 0 ? filteredData[filteredData.length - 1]?.terjual || 0 : 0) * hargaJualPerPorsi,
    totalProfit,
    persentaseEfisiensi,
    totalPendapatan,
    totalHPP,
    totalPotensiHilang,
    totalModalTerbuang: totalSisa * hppPerPorsi,
    stokSaatIni: totalSisa,
    perluBelanja: totalSisa < (filteredData.length > 0 ? filteredData[filteredData.length - 1]?.thresholdBelanja || salesData.thresholdBelanja : salesData.thresholdBelanja),
    totalBelanja,
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <header className="pt-12 pb-4 text-center border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-700 tracking-wide">DASHBOARD</h1>
        <p className="text-sm text-gray-400 mt-0.5">manajemen penjualan & stok</p>
        <div className="mt-2 text-xs text-gray-400">
          Master aktif: {new Date(activeMaster.tanggalBerlaku).toLocaleDateString('id-ID')}
          {' · '}
          HPP: Rp{activeMaster.hppPerPorsi.toLocaleString('id-ID')}
        </div>
        {metrics.perluBelanja && (
          <div className="mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg inline-block">
            ⚠️ Stok menipis ({metrics.stokSaatIni} porsi tersisa)
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <DashboardGrid
            metrics={metrics}
            onOpenForm={() => setIsFormOpen(true)}
            onOpenBelanja={() => setIsBelanjaOpen(true)}
            showTable={showTable}
            onToggleTable={() => setShowTable(!showTable)}
            tableData={filteredData}
            targetHarian={targetHarian}
            hppPerPorsi={hppPerPorsi}
            hargaJualPerPorsi={hargaJualPerPorsi}
            labaPerPorsi={labaPerPorsi}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-gray-300">
        data real-time · periode mingguan
      </footer>

      <PenjualanForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={async (data) => {
          try {
            const res = await fetch('/api/penjualan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const result = await res.json();
            if (result.status === '✅ Berhasil!') {
              setIsFormOpen(false);
              await fetchData();
              alert('Penjualan berhasil disimpan!');
            } else {
              alert(result.error || 'Gagal menyimpan data');
            }
          } catch (error) {
            alert('Terjadi kesalahan');
          }
        }}
        targetHarian={targetHarian}
        loading={false}
      />

      <PembelianForm
        isOpen={isBelanjaOpen}
        onClose={() => setIsBelanjaOpen(false)}
        onSubmit={async (data) => {
          try {
            const res = await fetch('/api/pembelian', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const result = await res.json();
            if (result.status === '✅ Berhasil!') {
              setIsBelanjaOpen(false);
              await fetchData();
              alert('Pembelian berhasil disimpan!');
            } else {
              alert(result.error || 'Gagal menyimpan data');
            }
          } catch (error) {
            alert('Terjadi kesalahan');
          }
        }}
        hppPerPorsi={hppPerPorsi}
        loading={false}
      />
    </main>
  );
}