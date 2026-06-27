// app/components/dashboard/PenjualanTable.tsx

'use client';

interface PenjualanItem {
  id: string;
  tanggal: string;
  hariNama: string;
  terjual: number;
  sisa: number;
  stokAwal: number;
  status: string;
  perluBelanja: boolean;
}

interface PenjualanTableProps {
  data: PenjualanItem[];
  targetHarian: number;
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'aman': return 'bg-green-100 text-green-700';
    case 'waspada': return 'bg-yellow-100 text-yellow-700';
    case 'habis': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-500';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'aman': return '✅ Aman';
    case 'waspada': return '⚠️ Waspada';
    case 'habis': return '❌ Habis';
    default: return '⚪ Belum Terjadi';
  }
};

export default function PenjualanTable({
  data,
  targetHarian,
  hppPerPorsi,
  hargaJualPerPorsi,
  labaPerPorsi,
  onEdit,
  onDelete,
}: PenjualanTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-400">Belum ada data penjualan</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          📊 Detail Penjualan Harian
        </h3>
        <div className="text-xs text-gray-400 flex flex-wrap gap-2 items-center">
          <span>HPP: {formatRupiah(hppPerPorsi)}</span>
          <span>|</span>
          <span>Jual: {formatRupiah(hargaJualPerPorsi)}</span>
          <span>|</span>
          <span>Laba: {formatRupiah(labaPerPorsi)}/porsi</span>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50/95 z-10">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Hari</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Terjual</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Stok Awal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Sisa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Pendapatan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">HPP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Profit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const pendapatan = item.terjual * hargaJualPerPorsi;
              const hpp = item.terjual * hppPerPorsi;
              const profit = item.terjual * labaPerPorsi;

              let rowClass = 'border-b border-gray-50 hover:bg-gray-50/50 transition-colors';
              if (item.sisa === 0) {
                rowClass += ' bg-red-50/50 hover:bg-red-100/50';
              } else if (item.perluBelanja) {
                rowClass += ' bg-yellow-50/50 hover:bg-yellow-100/50';
              }

              return (
                <tr key={idx} className={rowClass}>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                    {new Date(item.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.hariNama}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{targetHarian}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{item.terjual}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.stokAwal}</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${item.sisa > 0 ? 'text-orange-500' : 'text-red-400'}`}>
                    {item.sisa}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatRupiah(pendapatan)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatRupiah(hpp)}</td>
                  <td className="px-4 py-3 font-medium text-green-600 whitespace-nowrap">+{formatRupiah(profit)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span>📊 Total terjual: <strong className="text-gray-900">
            {data.reduce((s, i) => s + i.terjual, 0)}
          </strong> porsi</span>
          <span>💰 Total profit: <strong className="text-gray-900">
            {formatRupiah(data.reduce((s, i) => s + (i.terjual * labaPerPorsi), 0))}
          </strong></span>
          <span>📦 Sisa stok: <strong className="text-gray-900">
            {data[data.length - 1]?.sisa || 0}
          </strong> porsi</span>
        </div>
      </div>
    </div>
  );
}