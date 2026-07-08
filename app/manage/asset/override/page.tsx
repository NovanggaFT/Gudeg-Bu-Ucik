// app/manage/overhead/override/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface LaporanItem {
  id: string;
  bulan: Date;
  bulanStr: string;
  qtyProduksi: number;
  costPerPortion: number;
  jumlahCost: number;
  overhead: number;
  gaji: number;
  labaKotor: number;
  profit: number;
  defaultOverhead: number;
  isOverridden: boolean;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatBulan = (bulanStr: string) => {
  const [year, month] = bulanStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

export default function OverrideOverheadPage() {
  const [data, setData] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/laporan-bulanan/override-overhead');
      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOverride = async (id: string, bulan: string, currentOverhead: number) => {
    const { value } = await Swal.fire({
      title: `Override Overhead ${formatBulan(bulan)}`,
      text: 'Masukkan nilai overhead baru (0 untuk menghapus)',
      input: 'number',
      inputValue: currentOverhead,
      inputPlaceholder: 'Masukkan nominal overhead',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: (value) => {
        if (value === '' || value === null || value === undefined) {
          Swal.showValidationMessage('Nilai tidak boleh kosong');
          return;
        }
        return Number(value);
      },
    });

    if (value !== undefined) {
      try {
        const res = await fetch('/api/laporan-bulanan/override-overhead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulan, overhead: value }),
        });

        const result = await res.json();

        if (result.status === '✅ Berhasil!') {
          await fetchData();
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            text: `Overhead diupdate menjadi ${formatRupiah(value)}`,
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: error.message,
        });
      }
    }
  };

  const handleReset = async (id: string, bulan: string, defaultOverhead: number) => {
    const result = await Swal.fire({
      title: `Reset Overhead ${formatBulan(bulan)}`,
      text: `Kembalikan ke nilai default: ${formatRupiah(defaultOverhead)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Reset!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/laporan-bulanan/override-overhead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bulan, overhead: defaultOverhead }),
        });

        const result = await res.json();

        if (result.status === '✅ Berhasil!') {
          await fetchData();
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            text: `Overhead direset ke ${formatRupiah(defaultOverhead)}`,
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Gagal!' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎛️ Override Overhead Bulanan</h1>
            <p className="text-sm text-gray-500">
              Atur overhead per bulan secara manual (override dari Asset)
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm text-blue-700 font-medium">Cara Kerja Overhead:</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• Default overhead diambil dari total <strong>Asset.perMonth</strong></li>
                <li>• Anda bisa <strong>override</strong> nilai overhead per bulan</li>
                <li>• Klik <strong>Reset</strong> untuk kembali ke nilai default</li>
                <li>• Klik <strong>Set 0</strong> untuk menghapus overhead bulan tersebut</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Bulan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Qty Produksi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Gaji</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Laba Kotor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Overhead</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      📭 Belum ada laporan bulanan
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatBulan(item.bulanStr)}
                        {item.isOverridden && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            Override
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.qtyProduksi}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(item.jumlahCost)}</td>
                      <td className="px-4 py-3 text-right text-pink-600">{formatRupiah(item.gaji)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatRupiah(item.labaKotor)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${item.isOverridden ? 'text-orange-600' : 'text-purple-600'}`}>
                          {formatRupiah(item.overhead)}
                        </span>
                        {!item.isOverridden && (
                          <span className="text-xs text-gray-400 ml-1">(default)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {formatRupiah(item.profit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleOverride(item.id, item.bulanStr, item.overhead)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleOverride(item.id, item.bulanStr, 0)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            0️⃣ Set 0
                          </button>
                          {item.isOverridden && (
                            <button
                              onClick={() => handleReset(item.id, item.bulanStr, item.defaultOverhead)}
                              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              ↩️ Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}