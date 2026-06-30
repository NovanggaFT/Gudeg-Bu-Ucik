// app/components/dashboard/SalesChart.tsx

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface ChartData {
  tanggal: string;
  hariNama: string;
  terjual: number;
  target: number;
  belanja: number;
  sisa: number;
}

interface SalesChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export default function SalesChart({
  data = [],
  title = '📊 Grafik Penjualan & Pembelian',
  height = 350,
  showLegend = true,
}: SalesChartProps) {
  // ✅ Cek data kosong
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">Belum ada data untuk ditampilkan</p>
        <p className="text-gray-300 text-xs mt-1">Silakan input penjualan terlebih dahulu</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    label: `${item.hariNama.substring(0, 3)} ${new Date(item.tanggal).getDate()}`,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Terjual
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Belanja
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
            Sisa
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-red-400 border-dashed"></span>
            Target
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#888' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => value.toString()}
          />
          <Tooltip
            formatter={(value: any, name: any) => {
              // ✅ FIX: handle undefined
              if (value === undefined || value === null) return ['-', name || ''];
              if (typeof value !== 'number') return [value, name || ''];
              
              const map: Record<string, string> = {
                terjual: 'Terjual',
                belanja: 'Belanja',
                sisa: 'Sisa',
                target: 'Target',
              };
              return [`${value} porsi`, map[name] || name || ''];
            }}
            labelFormatter={(label: any) => `Tanggal: ${label || ''}`}
          />
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: any) => {
                const map: Record<string, string> = {
                  terjual: 'Terjual',
                  belanja: 'Belanja',
                  sisa: 'Sisa',
                  target: 'Target',
                };
                return map[value] || value || '';
              }}
            />
          )}
          <Bar dataKey="terjual" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="belanja" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sisa" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#EF4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>
          Total Terjual: <strong className="text-gray-700">{data.reduce((s, i) => s + i.terjual, 0)}</strong> porsi
        </span>
        <span>
          Total Belanja: <strong className="text-gray-700">{data.reduce((s, i) => s + i.belanja, 0)}</strong> porsi
        </span>
        <span>
          Rata-rata Terjual: <strong className="text-gray-700">
            {(data.reduce((s, i) => s + i.terjual, 0) / data.length).toFixed(1)}
          </strong> porsi/hari
        </span>
      </div>
    </div>
  );
}