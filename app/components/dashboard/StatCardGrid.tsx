// app/components/dashboard/StatCardGrid.tsx

'use client';

import Link from 'next/link';
import StatCard from './StatCard';

export interface CardItem {
  id: number;
  title: string;
  value: string;
  subtitle: string;
  color: 'aset' | 'penjualan' | 'profit' | 'efisiensi';
  link: string;
  icon: React.ReactNode; // ✅ Sudah benar
}

interface StatCardGridProps {
  cards: CardItem[];
  className?: string;
}

export default function StatCardGrid({ cards, className = '' }: StatCardGridProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto ${className}`}>
      {cards.map((card) => (
        <Link 
          href={card.link} 
          key={card.id} 
          className="block hover:opacity-90 transition-opacity"
        >
          <StatCard
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
          />
        </Link>
      ))}
    </div>
  );
}