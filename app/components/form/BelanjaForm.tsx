// app/components/form/BelanjaForm.tsx

"use client";

import { useState, useEffect } from "react";

interface BelanjaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jumlah: number, keterangan: string) => void;
  stokSaatIni: number;
}

export default function BelanjaForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  stokSaatIni 
}: BelanjaFormProps) {
  const [jumlah, setJumlah] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setJumlah("");
      setKeterangan("");
    }
  }, [isOpen]);

  // ✅ ESCAPE KEY CLOSE
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(jumlah);
    
    if (isNaN(value) || value <= 0) {
      alert("Jumlah belanja harus lebih dari 0");
      return;
    }
    
    onSubmit(value, keterangan);
  };

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
                🛒 Belanja Stok
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
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Stok saat ini: <span className="font-bold text-blue-600">{stokSaatIni} porsi</span>
              </p>
              {stokSaatIni < 100 && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Stok menipis! Segera belanja.
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Belanja (porsi)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={jumlah}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setJumlah(val);
                }}
                placeholder="Masukkan jumlah belanja..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan (opsional)
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Belanja mingguan..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
              >
                ✅ Belanja
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}