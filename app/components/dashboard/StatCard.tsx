// app/components/dashboard/StatCard.tsx

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'aset' | 'penjualan' | 'profit' | 'efisiensi';
  link?: string;
}

export default function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const colorClasses = {
    aset: 'bg-purple-50 border-purple-100',
    penjualan: 'bg-blue-50 border-blue-100',
    profit: 'bg-green-50 border-green-100',
    efisiensi: 'bg-orange-50 border-orange-100',
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]} bg-opacity-50`}>
          {icon}
        </div>
      </div>
    </div>
  );
}