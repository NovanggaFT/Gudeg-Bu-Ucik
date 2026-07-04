// app/manage/product/page.tsx

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
  targetStok: number;
  isActive: boolean;
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
            <p className="text-sm text-gray-500">Kelola data produk</p>
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

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{editingId ? '✏️ Edit Produk' : '📝 Tambah Produk'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" placeholder="Nama Produk" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                <input type="text" placeholder="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                <input type="number" placeholder="HPP" value={formData.hpp} onChange={(e) => setFormData({ ...formData, hpp: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                <input type="number" placeholder="Harga Jual" value={formData.hargaJual} onChange={(e) => setFormData({ ...formData, hargaJual: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
                <input type="number" placeholder="Target Stok" value={formData.targetStok} onChange={(e) => setFormData({ ...formData, targetStok: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors disabled:opacity-50">{isSubmitting ? '⏳ Menyimpan...' : 'Simpan'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">Batal</button>
              </div>
            </form>
          </div>
        )}

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
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium text-gray-900">{item.nama}</td>
                    <td className="px-4 py-2 text-gray-500">{item.sku}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hpp)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatRupiah(item.hargaJual)}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-700">{item.stok}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => handleEdit(item)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">✏️</button>
                      <button onClick={() => handleDelete(item.id, item.nama)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">Total {data.length} produk</div>
        </div>
      </div>
    </div>
  );
}