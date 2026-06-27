// app/components/manage/PembelianForm.tsx

'use client';

import { useState, useEffect } from 'react';

interface PembelianFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    tanggal: string; 
    jumlah?: number; 
    total?: number; 
    keterangan?: string 
  }) => void;
  initialData?: {
    id: string;
    tanggal: string;
    jumlah: number | null;
    total: number | null;
    keterangan: string | null;
  } | null;
  hppPerPorsi: number;
  loading?: boolean;
}

export default function PembelianForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  hppPerPorsi,
  loading = false,
}: PembelianFormProps) {
  const [tanggal, setTanggal] = useState('');
  const [jumlah, setJumlah] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [inputMode, setInputMode] = useState<'jumlah' | 'total'>('jumlah');

  useEffect(() => {
    if (initialData) {
      setTanggal(initialData.tanggal);
      setJumlah(initialData.jumlah);
      setTotal(initialData.total);
      setKeterangan(initialData.keterangan || '');
      
      if (initialData.jumlah) {
        setInputMode('jumlah');
      } else if (initialData.total) {
        setInputMode('total');
      }
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setJumlah(null);
      setTotal(null);
      setKeterangan('');
      setInputMode('jumlah');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: { 
      tanggal: string; 
      jumlah?: number; 
      total?: number; 
      keterangan?: string 
    } = {
      tanggal,
      keterangan: keterangan || undefined,
    };

    if (inputMode === 'jumlah' && jumlah !== null && jumlah > 0) {
      data.jumlah = jumlah;
    } else if (inputMode === 'total' && total !== null && total > 0) {
      data.total = total;
    } else {
      alert('Isi salah satu: Jumlah atau Total (harus lebih dari 0)');
      return;
    }

    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {initialData ? '✏️ Edit Pembelian' : '🛒 Input Pembelian'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputMode('jumlah')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  inputMode === 'jumlah'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Jumlah Unit
              </button>
              <button
                type="button"
                onClick={() => setInputMode('total')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  inputMode === 'total'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Total Harga
              </button>
            </div>
          </div>

          {inputMode === 'jumlah' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah (unit)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={jumlah || ''}
                  onChange={(e) => setJumlah(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan jumlah unit"
                />
                <span className="text-sm text-gray-400">porsi</span>
              </div>
              {jumlah !== null && jumlah > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  💰 Total otomatis: {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(jumlah * hppPerPorsi)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Harga
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Rp</span>
                <input
                  type="number"
                  min="1"
                  value={total || ''}
                  onChange={(e) => setTotal(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan total harga"
                />
              </div>
              {total !== null && total > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  📦 Jumlah otomatis: {Math.floor(total / hppPerPorsi)} porsi
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keterangan (opsional)
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Catatan pembelian..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}