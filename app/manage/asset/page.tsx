// app/manage/asset/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface AssetItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  perMonth: number;
  status: 'Baik' | 'Rusak' | 'Perbaikan';
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function AssetPage() {
  const [assets, setAssets] = useState<AssetItem[]>([
    {
      id: '1',
      name: 'Biaya Air, Listrik',
      category: 'Overhead',
      quantity: 1,
      price: 555000,
      total: 6660000,
      perMonth: 555000,
      status: 'Baik',
    },
    {
      id: '2',
      name: 'Biaya Bahan Bakar',
      category: 'Overhead',
      quantity: 1,
      price: 5200000,
      total: 62400000,
      perMonth: 5200000,
      status: 'Baik',
    },
    {
      id: '3',
      name: 'Biaya Penyusutan Aset',
      category: 'Overhead',
      quantity: 39,
      price: 28164775,
      total: 28164775,
      perMonth: 2347065,
      status: 'Baik',
    },
    {
      id: '4',
      name: 'Biaya Sewa',
      category: 'Overhead',
      quantity: 1,
      price: 333333,
      total: 3999996,
      perMonth: 333333,
      status: 'Baik',
    },
    {
      id: '5',
      name: 'Biaya Retribusi Pasar',
      category: 'Overhead',
      quantity: 3,
      price: 480000,
      total: 5760000,
      perMonth: 480000,
      status: 'Baik',
    },
    {
      id: '6',
      name: 'Biaya Bahan Penolong',
      category: 'Overhead',
      quantity: 6,
      price: 2788500,
      total: 33462000,
      perMonth: 2788500,
      status: 'Baik',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Overhead',
    quantity: '',
    price: '',
    status: 'Baik' as 'Baik' | 'Rusak' | 'Perbaikan',
  });

  const totalAset = assets.reduce((s, i) => s + i.total, 0);
  const totalPerMonth = assets.reduce((s, i) => s + i.perMonth, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Baik': return 'bg-green-100 text-green-700';
      case 'Rusak': return 'bg-red-100 text-red-700';
      case 'Perbaikan': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  // ============================================
  // CRUD
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.price) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap!',
        text: 'Nama, Quantity, dan Price wajib diisi',
      });
      return;
    }

    setIsSubmitting(true);

    const qty = Number(formData.quantity);
    const price = Number(formData.price);
    const total = qty * price;
    const perMonth = Math.round(total / 12);

    if (editingId) {
      // UPDATE
      setAssets(prev => prev.map(item =>
        item.id === editingId
          ? {
              ...item,
              name: formData.name,
              category: formData.category,
              quantity: qty,
              price: price,
              total: total,
              perMonth: perMonth,
              status: formData.status,
            }
          : item
      ));
      Swal.fire({
        icon: 'success',
        title: '✅ Berhasil!',
        text: 'Asset berhasil diupdate',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      // CREATE
      const newAsset: AssetItem = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        quantity: qty,
        price: price,
        total: total,
        perMonth: perMonth,
        status: formData.status,
      };
      setAssets(prev => [...prev, newAsset]);
      Swal.fire({
        icon: 'success',
        title: '✅ Berhasil!',
        text: 'Asset berhasil ditambahkan',
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', category: 'Overhead', quantity: '', price: '', status: 'Baik' });
    setIsSubmitting(false);
  };

  const handleEdit = (item: AssetItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      price: String(item.price),
      status: item.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: `Hapus ${name}?`,
      text: "Data akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      setAssets(prev => prev.filter(item => item.id !== id));
      Swal.fire({
        icon: 'success',
        title: '✅ Berhasil!',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'Overhead', quantity: '', price: '', status: 'Baik' });
    setShowForm(false);
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
            <h1 className="text-2xl font-bold text-gray-800">🏦 Asset & Overhead</h1>
            <p className="text-sm text-gray-400">Kelola aset dan biaya overhead pabrik</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Asset
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? '✏️ Edit Asset' : '📝 Tambah Asset'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Nama Asset"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="Overhead">Overhead</option>
                  <option value="Peralatan Masak">Peralatan Masak</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <input
                  type="number"
                  placeholder="Harga per Unit"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="mt-4">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Baik' | 'Rusak' | 'Perbaikan' })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 w-full md:w-auto"
                >
                  <option value="Baik">Baik</option>
                  <option value="Rusak">Rusak</option>
                  <option value="Perbaikan">Perbaikan</option>
                </select>
              </div>
              {/* Preview */}
              {formData.quantity && formData.price && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Preview:</span>
                  {Number(formData.quantity)} × {formatRupiah(Number(formData.price))} = 
                  <span className="font-bold text-blue-600 ml-1">
                    {formatRupiah(Number(formData.quantity) * Number(formData.price))}
                  </span>
                  <span className="ml-2 text-xs text-gray-400">
                    (Per Bulan: {formatRupiah(Math.round((Number(formData.quantity) * Number(formData.price)) / 12))})
                  </span>
                </div>
              )}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Total Asset</p>
            <p className="text-2xl font-bold">{formatRupiah(totalAset)}</p>
            <p className="text-xs opacity-70 mt-1">{assets.length} item</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Overhead per Bulan</p>
            <p className="text-2xl font-bold">{formatRupiah(totalPerMonth)}</p>
            <p className="text-xs opacity-70 mt-1">Biaya tetap bulanan</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
            <p className="text-sm opacity-80">Overhead per Tahun</p>
            <p className="text-2xl font-bold">{formatRupiah(totalPerMonth * 12)}</p>
            <p className="text-xs opacity-70 mt-1">Total biaya overhead tahunan</p>
          </div>
        </div>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Harga/Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Per Bulan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{formatRupiah(item.price)}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatRupiah(item.total)}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{formatRupiah(item.perMonth)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            Total {assets.length} item overhead
          </div>
        </div>
      </div>
    </div>
  );
}