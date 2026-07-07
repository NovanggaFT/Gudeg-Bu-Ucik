// app/manage/product/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
  harga: number;
  stok: number;
  stokMinimal: number;
}

interface BahanBakuResep {
  id: string;
  bahanBakuId: string;
  qty: number;
  bahanBaku: BahanBaku;
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
  calculatedHPP?: number;
  hppDiff?: number;
}

interface ResepItem {
  bahanBakuId: string;
  qty: number;
  bahanBakuNama?: string;
  satuan?: string;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

export default function ProductPage() {
  const [data, setData] = useState<Produk[]>([]);
  const [bahanBakuList, setBahanBakuList] = useState<BahanBaku[]>([]);
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
  const [resep, setResep] = useState<ResepItem[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, bahanRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/bahan-baku'),
      ]);

      const products = await productsRes.json();
      const bahan = await bahanRes.json();

      if (products.status === '✅ Berhasil!') {
        setData(products.data);
      }
      if (bahan.status === '✅ Berhasil!') {
        setBahanBakuList(bahan.data);
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

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      sku: '',
      hpp: '',
      hargaJual: '',
      targetStok: '',
    });
    setResep([]);
    setShowForm(false);
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
    setResep(
      item.bahanBaku.map((b) => ({
        bahanBakuId: b.bahanBakuId,
        qty: b.qty,
        bahanBakuNama: b.bahanBaku.nama,
        satuan: b.bahanBaku.satuan,
      }))
    );
    setShowForm(true);
  };

  const handleAddResep = () => {
    setResep([...resep, { bahanBakuId: '', qty: 0 }]);
  };

  const handleRemoveResep = (index: number) => {
    setResep(resep.filter((_, i) => i !== index));
  };

  const handleResepChange = (index: number, field: string, value: any) => {
    const newResep = [...resep];
    newResep[index] = { ...newResep[index], [field]: value };

    if (field === 'bahanBakuId') {
      const bahan = bahanBakuList.find((b) => b.id === value);
      if (bahan) {
        newResep[index].bahanBakuNama = bahan.nama;
        newResep[index].satuan = bahan.satuan;
      }
    }

    setResep(newResep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validasi resep
      const invalidResep = resep.some(
        (r) => !r.bahanBakuId || r.qty <= 0
      );
      if (resep.length > 0 && invalidResep) {
        Swal.fire({
          icon: 'error',
          title: 'Resep Tidak Lengkap!',
          text: 'Pastikan semua bahan baku terisi dan qty > 0',
        });
        setIsSubmitting(false);
        return;
      }

      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        nama: formData.nama,
        sku: formData.sku,
        hpp: Number(formData.hpp),
        hargaJual: Number(formData.hargaJual),
        targetStok: Number(formData.targetStok) || 0,
        resep: resep.map((r) => ({
          bahanBakuId: r.bahanBakuId,
          qty: r.qty,
        })),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.status === '✅ Berhasil!') {
        resetForm();
        await fetchData();
        Swal.fire({
          icon: 'success',
          title: '✅ Berhasil!',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: result.error || 'Terjadi kesalahan',
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const result = await Swal.fire({
      title: `Hapus ${nama}?`,
      text: 'Data akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchData();
          Swal.fire({
            icon: 'success',
            title: '✅ Berhasil!',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Gagal!' });
      }
    }
  };

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

    // Hitung stok produk
    let stokProduk = Infinity;
    const bahanDetail = bahanList.map((item) => {
      const hargaPerSatuan = item.bahanBaku.harga;
      const subtotal = Math.round(item.qty * hargaPerSatuan);
      const stokDariBahan = item.bahanBaku.stok / item.qty;

      if (stokDariBahan < stokProduk) {
        stokProduk = stokDariBahan;
      }

      return {
        nama: item.bahanBaku.nama,
        satuan: item.bahanBaku.satuan,
        qtyDibutuhkan: item.qty,
        stokTersedia: item.bahanBaku.stok,
        stokProduk: stokDariBahan,
        hargaPerSatuan: hargaPerSatuan,
        subtotal: subtotal,
      };
    });

    stokProduk = Math.floor(stokProduk);
    const totalHPP = bahanDetail.reduce((sum, item) => sum + item.subtotal, 0);

    let html = `
      <div style="text-align: left; max-height: 400px; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 12px; background: #f3f4f6; border-radius: 8px;">
          <span style="font-weight: bold;">🏷️ Stok Produk: <span style="color: #2563eb;">${stokProduk} porsi</span></span>
          <span style="font-weight: bold;">💰 Total HPP: <span style="color: #16a34a;">${formatRupiah(totalHPP)}</span></span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 6px 10px; text-align: left;">Nama Bahan</th>
              <th style="padding: 6px 10px; text-align: center;">Qty/Porsi</th>
              <th style="padding: 6px 10px; text-align: center;">Satuan</th>
              <th style="padding: 6px 10px; text-align: center;">Harga/Satuan</th>
              <th style="padding: 6px 10px; text-align: center;">Stok Bahan</th>
              <th style="padding: 6px 10px; text-align: center;">Stok Produk</th>
              <th style="padding: 6px 10px; text-align: center;">Subtotal</th>
              <th style="padding: 6px 10px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const item of bahanDetail) {
      const status = stokProduk <= 0 ? '❌ Habis' :
        stokProduk < 50 ? '⚠️ Menipis' : '✅ Aman';
      const statusColor = stokProduk <= 0 ? '#dc2626' :
        stokProduk < 50 ? '#d97706' : '#16a34a';

      html += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 6px 10px;">${item.nama}</td>
          <td style="padding: 6px 10px; text-align: center;">${item.qtyDibutuhkan}</td>
          <td style="padding: 6px 10px; text-align: center;">${item.satuan}</td>
          <td style="padding: 6px 10px; text-align: center;">${formatRupiah(item.hargaPerSatuan)}</td>
          <td style="padding: 6px 10px; text-align: center;">${item.stokTersedia}</td>
          <td style="padding: 6px 10px; text-align: center; font-weight: bold;">${Math.floor(item.stokProduk)} porsi</td>
          <td style="padding: 6px 10px; text-align: center; color: #16a34a;">${formatRupiah(item.subtotal)}</td>
          <td style="padding: 6px 10px; text-align: center;">
            <span style="color: ${statusColor}; font-weight: bold;">${status}</span>
          </td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
        <p style="margin-top: 12px; font-size: 11px; color: #6b7280; text-align: center;">
          * Stok produk dihitung dari bahan baku yang paling terbatas
        </p>
      </div>
    `;

    Swal.fire({
      title: `📋 Resep ${produk.nama}`,
      html: html,
      width: 950,
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
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📦 Produk</h1>
            <p className="text-sm text-gray-500">Kelola data produk dan resep</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
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
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Produk' : '📝 Tambah Produk'}
            </h3>
            <form onSubmit={handleSubmit}>
              {/* Informasi Produk */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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

              {/* Resep */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">📋 Resep (Bahan Baku)</h4>
                  <button
                    type="button"
                    onClick={handleAddResep}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    + Tambah Bahan
                  </button>
                </div>

                {resep.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Belum ada bahan baku. Klik "Tambah Bahan" untuk menambahkan resep.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {resep.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <select
                          value={item.bahanBakuId}
                          onChange={(e) => handleResepChange(index, 'bahanBakuId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                        >
                          <option value="">Pilih Bahan Baku</option>
                          {bahanBakuList.map((bahan) => (
                            <option key={bahan.id} value={bahan.id}>
                              {bahan.nama} ({bahan.satuan}) - {formatRupiah(bahan.harga)}/{bahan.satuan}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.qty || ''}
                          onChange={(e) => handleResepChange(index, 'qty', Number(e.target.value))}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                          min="0.001"
                          step="0.001"
                        />
                        <span className="text-sm text-gray-500 w-16">
                          {item.satuan || 'g'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveResep(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {resep.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Total {resep.length} bahan baku
                  </div>
                )}
              </div>

              {/* Actions */}
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
                  onClick={resetForm}
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
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Resep</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      📭 Belum ada produk
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-gray-900">{item.nama}</td>
                      <td className="px-4 py-2 text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-gray-600">{formatRupiah(item.hpp)}</span>
                          {item.calculatedHPP !== undefined && (
                            <span className={`text-xs ${item.calculatedHPP === item.hpp ? 'text-green-500' : 'text-yellow-500'}`}>
                              {item.calculatedHPP === item.hpp ? '✅' : '⚠️'} {formatRupiah(item.calculatedHPP)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hargaJual)}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-700">{item.stok}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.bahanBaku.length > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                          }`}>
                          {item.bahanBaku.length} bahan
                        </span>
                      </td>
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
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
            <span>Total {data.length} produk</span>
            <span>Total resep: {data.reduce((sum, item) => sum + item.bahanBaku.length, 0)} bahan</span>
          </div>
        </div>
      </div>
    </div>
  );
}