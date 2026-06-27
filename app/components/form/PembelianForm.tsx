// app/components/form/PembelianForm.tsx

"use client";

import { useState, useEffect } from "react";

interface PembelianFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    tanggal: string; 
    jumlah?: number; 
    total?: number; 
    keterangan?: string 
  }) => void;
  hppPerPorsi: number;
  loading?: boolean;
}

export default function PembelianForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  hppPerPorsi,
  loading = false
}: PembelianFormProps) {
  const [tanggal, setTanggal] = useState("");
  const [jumlah, setJumlah] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTanggal(new Date().toISOString().split('T')[0]);
      setJumlah("");
      setTotal("");
      setKeterangan("");
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
    
    const jumlahNum = jumlah ? Number(jumlah) : null;
    const totalNum = total ? Number(total) : null;
    
    // Validasi: minimal salah satu diisi
    if (!jumlahNum && !totalNum) {
      setError("Isi salah satu: Jumlah atau Total");
      return;
    }
    
    // Validasi: tidak boleh negatif
    if (jumlahNum && jumlahNum <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }
    if (totalNum && totalNum <= 0) {
      setError("Total harus lebih dari 0");
      return;
    }
    
    setError("");
    
    const data: { 
      tanggal: string; 
      jumlah?: number; 
      total?: number; 
      keterangan?: string 
    } = {
      tanggal,
      keterangan: keterangan || undefined,
    };
    
    if (jumlahNum) data.jumlah = jumlahNum;
    if (totalNum) data.total = totalNum;
    
    onSubmit(data);
  };

  if (!isOpen) return null;

  const jumlahNum = jumlah ? Number(jumlah) : null;
  const totalNum = total ? Number(total) : null;
  
  // Preview otomatis
  const previewJumlah = totalNum ? Math.floor(totalNum / hppPerPorsi) : null;
  const previewTotal = jumlahNum ? jumlahNum * hppPerPorsi : null;

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
                🛒 Input Pembelian
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
              Tanggal: {tanggal} · HPP: Rp{hppPerPorsi.toLocaleString("id-ID")}/porsi
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah (unit)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={jumlah}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setJumlah(val);
                }}
                placeholder="Masukkan jumlah unit (opsional)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-gray-800"
              />
              {previewTotal !== null && jumlahNum && (
                <p className="mt-1 text-xs text-green-600">
                  💰 Total otomatis: Rp{previewTotal.toLocaleString("id-ID")}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Harga
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={total}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setTotal(val);
                  }}
                  placeholder="Masukkan total harga (opsional)"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-gray-800"
                />
              </div>
              {previewJumlah !== null && totalNum && (
                <p className="mt-1 text-xs text-green-600">
                  📦 Jumlah otomatis: {previewJumlah} porsi
                </p>
              )}
            </div>
            
            {error && (
              <p className="mb-4 text-sm text-red-500">{error}</p>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan (opsional)
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan pembelian..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-gray-800"
              />
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 mb-6 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>HPP per porsi:</span>
                <span className="font-medium">Rp{hppPerPorsi.toLocaleString("id-ID")}</span>
              </div>
              {(jumlahNum || totalNum) && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex justify-between text-gray-700">
                    <span>Preview:</span>
                    <span className="font-medium">
                      {jumlahNum && `${jumlahNum} porsi`}
                      {jumlahNum && totalNum && ' · '}
                      {totalNum && `Rp${totalNum.toLocaleString("id-ID")}`}
                    </span>
                  </div>
                </>
              )}
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
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Pembelian'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}