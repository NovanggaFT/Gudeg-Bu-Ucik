// app/components/manage/FilterBar.tsx

'use client';

import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (startDate: string, endDate: string) => void;
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export default function FilterBar({ onFilterChange, currentWeek, onWeekChange }: FilterBarProps) {
  const [selectedDate, setSelectedDate] = useState('');

  const getWeekRange = (weekOffset: number = 0) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7)); // Senin
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Minggu

    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
    };
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    onWeekChange(newWeek);
    const range = getWeekRange(newWeek);
    onFilterChange(range.start, range.end);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    // Filter by single date
    onFilterChange(date, date);
  };

  const range = getWeekRange(currentWeek);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleWeekChange('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
          {range.start} — {range.end}
        </span>
        <button
          onClick={() => handleWeekChange('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">Filter tanggal:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedDate && (
          <button
            onClick={() => {
              setSelectedDate('');
              const range = getWeekRange(currentWeek);
              onFilterChange(range.start, range.end);
            }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}