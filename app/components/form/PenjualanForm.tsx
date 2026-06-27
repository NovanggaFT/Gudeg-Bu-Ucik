// app/components/form/PenjualanForm.tsx

"use client";

import { useState, useEffect } from "react";

interface PenjualanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { tanggal: string; terjual: number }) => void;
  targetHarian: number;
  loading?: boolean;
}

export default function PenjualanForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  targetHarian,
  loading = false
}: PenjualanFormProps) {
  const [tanggal, setTanggal] = useState("");
  const [terjual, setTerjual] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTanggal(new Date().toISOString().split('T')[0]);
      setTerjual("");
      setError("");
    }
  }, [isOpen]);

  // ESCAPE KEY CLOSE
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = Number(terjual);
    
    if (isNaN(value) || value < 0) {
      setError("Penjualan tidak boleh negatif");
      return;
    }
    
    if (value === 0) {
      setError("Masukkan jumlah penjualan");
      return;
    }
    
    if (value > targetHarian * 3) {
      setError(`Penjualan terlalu tinggi (maks ${targetHarian * 3} porsi)`);
      return;
    }
    
    setError("");
    onSubmit({ tanggal, terjual: value });
  };

  if (!isOpen) return null;

  const valueNumber = Number(terjual) || 0;
  const sisaOtomatis = targetHarian - valueNumber > 0 ? targetHarian - valueNumber : 0;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-all duration-300"
        onClick={onClose}
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                📝 Input Penjualan
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Tanggal: {tanggal} · target {targetHarian} porsi/hari
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Porsi Terjual
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={terjual}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setTerjual(val);
                }}
                placeholder="Masukkan jumlah porsi"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-gray-800"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Sisa otomatis: {sisaOtomatis} porsi
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 mb-6 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>HPP per porsi:</span>
                <span className="font-medium">Rp13.000</span>
              </div>
              <div className="flex justify-between">
                <span>Harga jual:</span>
                <span className="font-medium">Rp15.000</span>
              </div>
              <div className="flex justify-between">
                <span>Laba per porsi:</span>
                <span className="font-medium text-green-600">Rp2.000</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span>Estimasi profit hari ini:</span>
                <span className="font-medium text-green-600">
                  Rp{(valueNumber * 2000).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal <span className="text-xs text-gray-400">(Esc)</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}