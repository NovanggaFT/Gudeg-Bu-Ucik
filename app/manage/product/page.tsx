// app/manage/product/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface BahanBakuResep {
  id: string;
  bahanBakuId: string;
  qty: number;
  bahanBaku: {
    id: string;
    nama: string;
    satuan: string;
    harga: number;
    stok: number;
  };
}

interface Produk {
  id: string;
  nama: string;
  sku: string;
  hpp: number;
  hargaJual: number;
  stok: number;
  targetStok: number;
  isActive: boolean;
  bahanBaku: BahanBakuResep[];
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function ProductPage() {
  const [data, setData] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    sku: '',
    hpp: '',
    hargaJual: '',
    targetStok: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const result = await res.json();
      if (result.status === '✅ Berhasil!') {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formData.nama,
          sku: formData.sku,
          hpp: Number(formData.hpp),
          hargaJual: Number(formData.hargaJual),
          targetStok: Number(formData.targetStok) || 0,
        }),
      });

      const result = await res.json();
      
      if (result.status === '✅ Berhasil!') {
        setShowForm(false);
        setEditingId(null);
        setFormData({ nama: '', sku: '', hpp: '', hargaJual: '', targetStok: '' });
        await fetchData();
        Swal.fire({ icon: 'success', title: '✅ Berhasil!', timer: 1500, showConfirmButton: false });
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal!', text: result.error || 'Terjadi kesalahan' });
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: `Hapus ${nama}?`,
      text: "Data akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchData();
          Swal.fire({ icon: 'success', title: '✅ Berhasil!', timer: 1500, showConfirmButton: false });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Gagal!' });
      }
    }
  };

  const handleEdit = (item: Produk) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      sku: item.sku,
      hpp: String(item.hpp),
      hargaJual: String(item.hargaJual),
      targetStok: String(item.targetStok),
    });
    setShowForm(true);
  };

  // ✅ VIEW RESEP - Popup detail bahan baku
  const handleViewResep = (produk: Produk) => {
    const bahanList = produk.bahanBaku || [];

    if (bahanList.length === 0) {
      Swal.fire({
        title: `📋 Resep ${produk.nama}`,
        text: 'Belum ada bahan baku yang terdaftar untuk produk ini',
        icon: 'info',
        confirmButtonText: 'Tutup',
      });
      return;
    }

    // Hitung stok produk dari bahan baku
    let stokProduk = Infinity;
    const bahanDetail = bahanList.map((item) => {
      const stokTersedia = item.bahanBaku.stok / item.qty;
      if (stokTersedia < stokProduk) stokProduk = stokTersedia;
      return {
        nama: item.bahanBaku.nama,
        satuan: item.bahanBaku.satuan,
        qtyDibutuhkan: item.qty,
        stokTersedia: item.bahanBaku.stok,
        stokProduk: stokTersedia,
      };
    });

    stokProduk = Math.floor(stokProduk);

    // Format HTML untuk popup
    let html = `
      <div style="text-align: left; max-height: 400px; overflow-y: auto;">
        <p style="font-weight: bold; margin-bottom: 12px;">
          🏷️ Stok Produk: <span style="color: #2563eb;">${stokProduk} porsi</span>
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px 12px; text-align: left;">Nama Bahan</th>
              <th style="padding: 8px 12px; text-align: center;">Qty/Porsi</th>
              <th style="padding: 8px 12px; text-align: center;">Stok Bahan</th>
              <th style="padding: 8px 12px; text-align: center;">Stok Produk</th>
              <th style="padding: 8px 12px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const item of bahanDetail) {
      const status = item.stokProduk <= 0 ? '❌ Habis' : 
                     item.stokProduk < 50 ? '⚠️ Menipis' : '✅ Aman';
      const statusColor = item.stokProduk <= 0 ? '#dc2626' : 
                          item.stokProduk < 50 ? '#d97706' : '#16a34a';
      
      html += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 8px 12px;">${item.nama}</td>
          <td style="padding: 8px 12px; text-align: center;">${item.qtyDibutuhkan} ${item.satuan}</td>
          <td style="padding: 8px 12px; text-align: center;">${item.stokTersedia} ${item.satuan}</td>
          <td style="padding: 8px 12px; text-align: center; font-weight: bold;">${Math.floor(item.stokProduk)} porsi</td>
          <td style="padding: 8px 12px; text-align: center;">
            <span style="color: ${statusColor}; font-weight: bold;">${status}</span>
          </td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
        <p style="margin-top: 12px; font-size: 12px; color: #6b7280; text-align: center;">
          * Stok produk dihitung dari bahan baku yang paling terbatas
        </p>
      </div>
    `;

    Swal.fire({
      title: `📋 Resep ${produk.nama}`,
      html: html,
      width: 700,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#2563eb',
    });
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
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 Produk</h1>
            <p className="text-sm text-gray-500">Kelola data produk dan resep</p>
          </div>
          <button
            onClick={() => { setEditingId(null); setFormData({ nama: '', sku: '', hpp: '', hargaJual: '', targetStok: '' }); setShowForm(true); }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{editingId ? '✏️ Edit Produk' : '📝 Tambah Produk'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Nama Produk"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="HPP"
                  value={formData.hpp}
                  onChange={(e) => setFormData({ ...formData, hpp: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="Harga Jual"
                  value={formData.hargaJual}
                  onChange={(e) => setFormData({ ...formData, hargaJual: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="Target Stok"
                  value={formData.targetStok}
                  onChange={(e) => setFormData({ ...formData, targetStok: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">SKU</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">HPP</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Harga Jual</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Stok</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">📭 Belum ada produk</td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-gray-900">{item.nama}</td>
                      <td className="px-4 py-2 text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hpp)}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hargaJual)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-700">{item.stok}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewResep(item)}
                            className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Lihat Resep"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Total {data.length} produk
          </div>
        </div>
      </div>
    </div>
  );
}