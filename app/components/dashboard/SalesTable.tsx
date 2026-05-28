// app/components/dashboard/SalesTable.tsx

import { salesData } from "@/app/data/salesData";

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function SalesTable() {
  const totalTerjual = salesData.realisasiHarian.reduce((sum, h) => sum + h.terjual, 0);
  const totalPendapatan = totalTerjual * salesData.hargaJualPerPorsi;
  const totalHPP = totalTerjual * salesData.hppPerPorsi;
  const totalProfit = totalTerjual * salesData.labaPerPorsi;
  const totalSisaNilai = salesData.realisasiHarian.reduce((sum, h) => sum + (h.sisa * salesData.hargaJualPerPorsi), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Detail Penjualan Harian
        </h3>
        <div className="text-xs text-gray-400">
          HPP: {formatRupiah(salesData.hppPerPorsi)} | Jual: {formatRupiah(salesData.hargaJualPerPorsi)} | Laba: {formatRupiah(salesData.labaPerPorsi)}/porsi
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hari</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Terjual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sisa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pendapatan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">HPP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Profit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {salesData.realisasiHarian.map((hari, idx) => {
              const pendapatan = hari.terjual * salesData.hargaJualPerPorsi;
              const hpp = hari.terjual * salesData.hppPerPorsi;
              const profit = hari.terjual * salesData.labaPerPorsi;
              const isLast = idx === salesData.realisasiHarian.length - 1;
              const status = hari.sisa === 0 
                ? "✅ Habis" 
                : hari.sisa <= 30 
                  ? "⚠️ Sisa sedikit" 
                  : "❌ Sisa banyak";
              
              return (
                <tr 
                  key={idx} 
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isLast ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-700 font-medium">Hari {hari.hari}</td>
                  <td className="px-4 py-3 text-gray-500">{salesData.targetHarian}</td>
                  <td className="px-4 py-3 text-gray-700">{hari.terjual}</td>
                  <td className={`px-4 py-3 ${hari.sisa > 0 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                    {hari.sisa}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatRupiah(pendapatan)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatRupiah(hpp)}</td>
                  <td className="px-4 py-3 font-medium text-green-600">+{formatRupiah(profit)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      hari.sisa === 0 
                        ? "bg-green-100 text-green-700" 
                        : hari.sisa <= 30 
                          ? "bg-yellow-100 text-yellow-700" 
                          : "bg-red-100 text-red-700"
                    }`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50/80 border-t border-gray-100">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
              <td className="px-4 py-3 text-gray-500">{salesData.targetHarian * 7}</td>
              <td className="px-4 py-3 font-semibold text-gray-700">{totalTerjual}</td>
              <td className="px-4 py-3 text-gray-500">-</td>
              <td className="px-4 py-3 font-semibold text-gray-700">{formatRupiah(totalPendapatan)}</td>
              <td className="px-4 py-3 font-semibold text-gray-700">{formatRupiah(totalHPP)}</td>
              <td className="px-4 py-3 font-semibold text-green-600">+{formatRupiah(totalProfit)}</td>
              <td className="px-4 py-3 text-xs text-red-500">
                Potensi hilang: {formatRupiah(totalSisaNilai)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Ringkasan kecil di bawah tabel */}
      <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
        <span>📊 Rata-rata penjualan: {(totalTerjual / 7).toFixed(0)} porsi/hari</span>
        <span>⚠️ Total sisa stok: {salesData.realisasiHarian.reduce((sum, h) => sum + h.sisa, 0)} porsi</span>
        <span>💰 Rata-rata profit/hari: {formatRupiah(totalProfit / 7)}</span>
      </div>
    </div>
  );
}