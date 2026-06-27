// app/components/manage/PenjualanForm.tsx

'use client';

import { useState, useEffect } from 'react';

interface PenjualanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { tanggal: string; terjual: number }) => void;
  initialData?: { tanggal: string; terjual: number } | null;
  targetHarian: number;
  loading?: boolean;
}

export default function PenjualanForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  targetHarian,
  loading = false,
}: PenjualanFormProps) {
  const [tanggal, setTanggal] = useState('');
  const [terjual, setTerjual] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setTanggal(initialData.tanggal);
      setTerjual(initialData.terjual);
    } else {
      setTanggal(new Date().toISOString().split('T')[0]);
      setTerjual(0);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ tanggal, terjual });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {initialData ? '✏️ Edit Penjualan' : '📝 Input Penjualan'}
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
              Jumlah Terjual
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={terjual}
                onChange={(e) => setTerjual(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-400">porsi</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Target harian: {targetHarian} porsi</p>
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}