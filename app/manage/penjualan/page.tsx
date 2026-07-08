// app/manage/penjualan/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface Produk {
  id: string;
  nama: string;
  sku: string;
  hpp: number;
  hargaJual: number;
  stok: number;
  bahanBaku?: {
    bahanBaku: {
      id: string;
      nama: string;
      satuan: string;
      stok: number;
    };
    qty: number;
  }[];
}

interface Penjualan {
  id: string;
  tanggal: string;
  produkId: string;
  produk: Produk;
  qty: number;
  hargaJual: number;
  hpp: number;
  profit: number;
}

interface StokInfo {
  produk: {
    stokTersedia: number;
    cukup: boolean;
  };
  bahanBaku: {
    nama: string;
    satuan: string;
    stokTersedia: number;
    dibutuhkan: number;
    cukup: boolean;
    kekurangan?: number;
  }[];
  semuaCukup: boolean;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function PenjualanPage() {
  const [data, setData] = useState<Penjualan[]>([]);
  const [filteredData, setFilteredData] = useState<Penjualan[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterProduk, setFilterProduk] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    produkId: '',
    qty: '',
    tanggal: new Date().toISOString().split('T')[0],
    hargaJual: '',
  });

  // ✅ State untuk info stok
  const [stokInfo, setStokInfo] = useState<StokInfo | null>(null);

  // ✅ Ambil produk untuk dropdown
  const fetchProduk = async () => {
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setProdukList(result.data);
      }
    } catch (error) {
      console.error('Error fetching produk:', error);
    }
  };

  // ✅ Ambil data penjualan
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/penjualan');

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setData(result.data);
        applyFilters(result.data, filterMonth, filterProduk);
      } else {
        throw new Error(result.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduk();
    fetchData();
  }, []);

  const applyFilters = (dataSource: Penjualan[], month: string, produk: string) => {
    let filtered = dataSource;

    if (month) {
      filtered = filtered.filter((item) => item.tanggal.startsWith(month));
    }

    if (produk !== 'all') {
      filtered = filtered.filter((item) => item.produkId === produk);
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (month: string, produk: string) => {
    setFilterMonth(month);
    setFilterProduk(produk);
    applyFilters(data, month, produk);
  };

  // ✅ Cek stok produk & bahan baku
  const cekStok = (produkId: string, qty: number): StokInfo | null => {
    const selected = produkList.find(p => p.id === produkId);
    if (!selected) return null;

    const stokProdukTersedia = selected.stok || 0;
    const cukupProduk = stokProdukTersedia >= qty;

    // Cek stok bahan baku
    const bahanBakuInfo = selected.bahanBaku?.map(item => {
      const stokTersedia = Number(item.bahanBaku.stok);
      const dibutuhkan = item.qty * qty;
      const cukup = stokTersedia >= dibutuhkan;

      return {
        nama: item.bahanBaku.nama,
        satuan: item.bahanBaku.satuan,
        stokTersedia,
        dibutuhkan,
        cukup,
        kekurangan: cukup ? undefined : dibutuhkan - stokTersedia,
      };
    }) || [];

    const semuaCukup = cukupProduk && bahanBakuInfo.every(b => b.cukup);

    return {
      produk: {
        stokTersedia: stokProdukTersedia,
        cukup: cukupProduk,
      },
      bahanBaku: bahanBakuInfo,
      semuaCukup,
    };
  };

  // ✅ Handle produk change
  const handleProdukChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const produkId = e.target.value;
    setFormData({ ...formData, produkId, qty: '', hargaJual: '' });
    setStokInfo(null);

    if (produkId) {
      const selected = produkList.find(p => p.id === produkId);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          produkId,
          hargaJual: String(selected.hargaJual)
        }));

        // Cek stok dengan qty 0 dulu
        const info = cekStok(produkId, 0);
        if (info) setStokInfo(info);
      }
    }
  };

  // ✅ Handle qty change
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const qty = e.target.value;
    setFormData({ ...formData, qty });

    if (formData.produkId && qty) {
      const qtyNum = Number(qty);
      if (qtyNum > 0) {
        const info = cekStok(formData.produkId, qtyNum);
        if (info) setStokInfo(info);
      }
    } else if (formData.produkId) {
      const info = cekStok(formData.produkId, 0);
      if (info) setStokInfo(info);
    }
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.produkId || !formData.qty || !formData.tanggal) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Produk, Qty, dan Tanggal wajib diisi',
      });
      return;
    }

    const qtyNum = Number(formData.qty);
    const hargaJualNum = Number(formData.hargaJual);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Qty tidak valid!',
        text: 'Qty harus lebih dari 0',
      });
      return;
    }

    if (isNaN(hargaJualNum) || hargaJualNum <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Harga Jual tidak valid!',
        text: 'Harga jual harus lebih dari 0',
      });
      return;
    }

    // ✅ CEK STOK SEBELUM SUBMIT
    if (stokInfo && !stokInfo.semuaCukup) {
      let pesanError = 'Stok tidak mencukupi!\n\n';

      if (!stokInfo.produk.cukup) {
        pesanError += `❌ Stok produk: ${stokInfo.produk.stokTersedia}\n`;
      }

      const bahanKurang = stokInfo.bahanBaku.filter(b => !b.cukup);
      if (bahanKurang.length > 0) {
        pesanError += '\n❌ Bahan baku kurang:\n';
        bahanKurang.forEach(b => {
          pesanError += `  - ${b.nama}: stok ${b.stokTersedia} ${b.satuan}, butuh ${b.dibutuhkan} ${b.satuan} (kurang ${b.kekurangan})\n`;
        });
      }

      Swal.fire({
        icon: 'error',
        title: '❌ Stok Tidak Cukup!',
        text: pesanError,
        confirmButtonText: 'OK',
      });
      return;
    }

    setIsSubmitting(true);

    const selectedProduk = produkList.find(p => p.id === formData.produkId);
    const hpp = selectedProduk?.hpp || 0;
    const profit = (hargaJualNum - hpp) * qtyNum;

    try {
      const res = await fetch('/api/penjualan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: formData.tanggal,
          produkId: formData.produkId,
          qty: qtyNum,
          hargaJual: hargaJualNum,
          hpp: hpp,
          profit: profit,
        }),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setFormData({
          produkId: '',
          qty: '',
          tanggal: new Date().toISOString().split('T')[0],
          hargaJual: ''
        });
        setStokInfo(null);
        await fetchData();
        await fetchProduk();

        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          text: result.message || 'Penjualan berhasil ditambahkan',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: result.error || 'Gagal menyimpan data',
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: error.message || 'Terjadi kesalahan pada server',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: `Hapus penjualan ${nama}?`,
      text: "Stok produk & bahan baku akan dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/penjualan/${id}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (res.ok) {
          await fetchData();
          await fetchProduk();
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            text: data.message || 'Data berhasil dihapus',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          throw new Error(data.error || 'Gagal menghapus');
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: error.message
        });
      }
    }
  };

  // Statistik
  const totalQty = filteredData.reduce((sum, item) => sum + item.qty, 0);
  const totalProfit = filteredData.reduce((sum, item) => sum + item.profit, 0);
  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.qty * item.hargaJual), 0);
  const uniqueProduk = [...new Set(filteredData.map(item => item.produk?.nama || item.produkId))];

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-500 text-lg">❌ {error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Management Penjualan</h1>
            <p className="text-sm text-gray-500">Kelola data penjualan harian</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) {
                setStokInfo(null);
                setFormData({
                  produkId: '',
                  qty: '',
                  tanggal: new Date().toISOString().split('T')[0],
                  hargaJual: ''
                });
              }
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Penjualan
          </button>
        </div>

        {/* Form Tambah */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 Tambah Data Penjualan</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
                  <select
                    value={formData.produkId}
                    onChange={handleProdukChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="">Pilih Produk</option>
                    {produkList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} ({p.sku}) - Stok: {p.stok || 0} | {formatRupiah(p.hargaJual)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input
                    type="number"
                    placeholder="Jumlah"
                    value={formData.qty}
                    onChange={handleQtyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Jual
                    <span className="text-xs text-gray-400 ml-1">(auto-fill)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Harga Jual"
                    value={formData.hargaJual}
                    onChange={(e) => setFormData({ ...formData, hargaJual: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                    min="1"
                    step="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* ✅ Info Stok */}
              {stokInfo && formData.produkId && (
                <div className="mt-3 space-y-2">
                  {/* Stok Produk */}
                  <div className={`p-3 rounded-lg text-sm border ${stokInfo.produk.cukup
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span>{stokInfo.produk.cukup ? '✅' : '❌'}</span>
                      <span className="font-medium">Stok Produk:</span>
                      <span>Tersedia <strong>{stokInfo.produk.stokTersedia}</strong></span>
                      {stokInfo.produk.cukup && formData.qty && (
                        <span>Sisa: <strong>{stokInfo.produk.stokTersedia - Number(formData.qty)}</strong></span>
                      )}
                      {!stokInfo.produk.cukup && (
                        <span className="text-red-600 font-bold">
                          (Kurang: {Number(formData.qty) - stokInfo.produk.stokTersedia})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stok Bahan Baku */}
                  {stokInfo.bahanBaku.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                        📦 Stok Bahan Baku
                      </div>
                      {stokInfo.bahanBaku.map((b, index) => (
                        <div
                          key={index}
                          className={`px-3 py-2 text-sm border-t border-gray-100 flex flex-wrap items-center gap-2 ${b.cukup ? 'text-green-700' : 'text-red-700 bg-red-50'
                            }`}
                        >
                          <span>{b.cukup ? '✅' : '❌'}</span>
                          <span className="font-medium">{b.nama}</span>
                          <span className="text-gray-500">
                            Stok: {b.stokTersedia} {b.satuan}
                          </span>
                          <span className="text-gray-500">
                            Butuh: {b.dibutuhkan} {b.satuan}
                          </span>
                          {!b.cukup && (
                            <span className="text-red-600 font-bold">
                              (Kurang: {b.kekurangan} {b.satuan})
                            </span>
                          )}
                          {b.cukup && formData.qty && (
                            <span className="text-green-600">
                              Sisa: {b.stokTersedia - b.dibutuhkan} {b.satuan}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status Total */}
                  <div className={`p-2 rounded-lg text-center text-sm font-medium ${stokInfo.semuaCukup
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {stokInfo.semuaCukup
                      ? '✅ Semua stok mencukupi'
                      : '❌ Stok tidak mencukupi'}
                  </div>
                </div>
              )}

              {/* Preview */}
              {formData.produkId && formData.qty && formData.hargaJual && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Preview:</span>
                  <span className="ml-2">
                    {Number(formData.qty)} × {formatRupiah(Number(formData.hargaJual))} =
                    <span className="font-bold text-blue-600 ml-1">
                      {formatRupiah(Number(formData.qty) * Number(formData.hargaJual))}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || (stokInfo ? !stokInfo.semuaCukup : false)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${isSubmitting || (stokInfo ? !stokInfo.semuaCukup : false)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setStokInfo(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="text-sm text-gray-600 font-medium">📅 Filter:</label>

          <input
            type="month"
            value={filterMonth}
            onChange={(e) => handleFilterChange(e.target.value, filterProduk)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer min-w-[180px]"
          />

          <select
            value={filterProduk}
            onChange={(e) => handleFilterChange(filterMonth, e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-w-[150px]"
          >
            <option value="all">📋 Semua Produk</option>
            {produkList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} (Stok: {p.stok || 0})
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-400 ml-auto">
            📊 {filteredData.length} data
          </span>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Qty</p>
            <p className="text-2xl font-bold">{totalQty}</p>
            <p className="text-xs opacity-70 mt-1">{uniqueProduk.length} produk</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Revenue</p>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Profit</p>
            <p className="text-2xl font-bold">{formatRupiah(totalProfit)}</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Rata-rata Qty/Hari</p>
            <p className="text-2xl font-bold">
              {filteredData.length > 0 ? (totalQty / filteredData.length).toFixed(1) : 0}
            </p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Tanggal</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Produk</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Harga Jual</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">HPP</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Profit</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      📭 Tidak ada data untuk filter ini
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-medium text-gray-900">{item.produk?.nama || '-'}</span>
                        <span className="text-xs text-gray-400 ml-1">({item.produk?.sku})</span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">{item.qty}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hargaJual)}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{formatRupiah(item.hpp)}</td>
                      <td className="px-4 py-2 text-right text-green-600 font-medium">{formatRupiah(item.profit)}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDelete(item.id, item.produk?.nama || '')}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus (stok akan dikembalikan)"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
            <span>Total {filteredData.length} data</span>
            <span>💰 Total Profit: {formatRupiah(totalProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}