// app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import DashboardGrid from '@/app/components/dashboard/DashboardGrid';
import PenjualanForm from '@/app/components/form/PenjualanForm';
import PembelianForm from '@/app/components/form/PembelianForm';

interface SalesData {
  id: string;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  realisasi: Array<{
    id: string;
    tanggal: string;
    terjual: number;
    sisa: number;
    stokAwal: number;
    status: string;
    perluBelanja: boolean;
  }>;
  riwayatBelanja: Array<{
    id: string;
    tanggal: string;
    jumlah: number;
    total: number | null;
    totalSystem: number | null;
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

  // Fetch data dari database
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/penjualan');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setSalesData(result.data);
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
        }));
        setFilteredData(tableData);
      } else {
        setError('Gagal mengambil data');
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

  if (error || !salesData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>❌ {error || 'Data tidak ditemukan'}</p>
        </div>
      </div>
    );
  }

  // Hitung metrics dari data (berdasarkan filtered data)
  const totalTerjual = filteredData.reduce((sum, h) => sum + h.terjual, 0);
  const totalSisa = filteredData.length > 0 ? filteredData[filteredData.length - 1]?.sisa || 0 : 0;
  
  // Hitung total belanja
  const totalBelanja = salesData.riwayatBelanja.reduce((sum, b) => {
    const jumlah = b.jumlah || b.totalSystem || 0;
    return sum + jumlah;
  }, 0);
  
  const totalPendapatan = totalTerjual * salesData.hargaJualPerPorsi;
  const totalHPP = totalTerjual * salesData.hppPerPorsi;
  const totalProfit = totalTerjual * salesData.labaPerPorsi;
  const totalPotensiHilang = totalSisa * salesData.hargaJualPerPorsi;
  const persentaseEfisiensi = filteredData.length > 0 
    ? (totalTerjual / (salesData.targetHarian * filteredData.length)) * 100 
    : 0;

  const metrics = {
    totalTerjual,
    totalSisa,
    sisaBahanBaku: (salesData.stokAwal + totalBelanja) - totalTerjual,
    nilaiAset: ((salesData.stokAwal + totalBelanja) - totalTerjual) * salesData.hppPerPorsi,
    penjualanHariIni: filteredData.length > 0 ? filteredData[filteredData.length - 1]?.terjual || 0 : 0,
    nilaiPenjualanHariIni: (filteredData.length > 0 ? filteredData[filteredData.length - 1]?.terjual || 0 : 0) * salesData.hargaJualPerPorsi,
    totalProfit,
    persentaseEfisiensi,
    totalPendapatan,
    totalHPP,
    totalPotensiHilang,
    totalModalTerbuang: totalSisa * salesData.hppPerPorsi,
    stokSaatIni: totalSisa,
    perluBelanja: totalSisa < salesData.thresholdBelanja,
    totalBelanja,
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="pt-12 pb-4 text-center border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-700 tracking-wide">
          DASHBOARD
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          manajemen penjualan & stok
        </p>
        {metrics.perluBelanja && (
          <div className="mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg inline-block">
            ⚠️ Stok menipis ({metrics.stokSaatIni} porsi tersisa)
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <DashboardGrid
            metrics={metrics}
            onOpenForm={() => setIsFormOpen(true)}
            onOpenBelanja={() => setIsBelanjaOpen(true)}
            showTable={showTable}
            onToggleTable={() => setShowTable(!showTable)}
            tableData={filteredData}
            targetHarian={salesData.targetHarian}
            hppPerPorsi={salesData.hppPerPorsi}
            hargaJualPerPorsi={salesData.hargaJualPerPorsi}
            labaPerPorsi={salesData.labaPerPorsi}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-300">
        data real-time · periode mingguan
      </footer>

      {/* Form Penjualan */}
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
              await fetchData(); // Refresh data
              alert('Penjualan berhasil disimpan!');
            } else {
              alert(result.error || 'Gagal menyimpan data');
            }
          } catch (error) {
            alert('Terjadi kesalahan');
          }
        }}
        targetHarian={salesData.targetHarian}
        loading={false}
      />

      {/* Form Pembelian */}
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
              await fetchData(); // Refresh data
              alert('Pembelian berhasil disimpan!');
            } else {
              alert(result.error || 'Gagal menyimpan data');
            }
          } catch (error) {
            alert('Terjadi kesalahan');
          }
        }}
        hppPerPorsi={salesData.hppPerPorsi}
        loading={false}
      />
    </main>
  );
}