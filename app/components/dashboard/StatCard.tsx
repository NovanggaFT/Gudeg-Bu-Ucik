// app/components/dashboard/StatCard.tsx

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "aset" | "penjualan" | "profit" | "efisiensi";  // tambahan warna
}

// app/components/dashboard/StatCard.tsx - dengan palet kamu

// app/components/dashboard/StatCard.tsx

const colorStyles = {
  aset: {
    border: "border-l-[#3B82F6]",      // Biru medium (professional, trust)
    bg: "bg-[#3B82F6]/10",
    icon: "text-[#3B82F6]",
    text: "text-[#3B82F6]"
  },
  penjualan: {
    border: "border-l-[#F59E0B]",      // Kuning/Orange (energik, menarik perhatian)
    bg: "bg-[#F59E0B]/10",
    icon: "text-[#F59E0B]",
    text: "text-[#F59E0B]"
  },
  profit: {
    border: "border-l-[#10B981]",      // Hijau teal (profit = positif, tapi tetap kalem)
    bg: "bg-[#10B981]/10",
    icon: "text-[#10B981]",
    text: "text-[#10B981]"
  },
  efisiensi: {
    border: "border-l-[#F97316]",      // Orange terang (warning ringan)
    bg: "bg-[#F97316]/10",
    icon: "text-[#F97316]",
    text: "text-[#F97316]"
  }
};

export default function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-8 ${styles.border} p-6 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2 tracking-tight">
            {value}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {subtitle}
          </p>
        </div>
        <div className={`${styles.bg} p-3 rounded-full ${styles.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}