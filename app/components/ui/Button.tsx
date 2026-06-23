/**
 * ========================================
 * BUTTON COMPONENT
 * ========================================
 * Reusable button dengan variasi style
 * 
 * PROPS:
 * - onClick: Function handler
 * - isOpen: Boolean untuk toggle state
 * - children: Optional custom label
 */

'use client';

import type { ButtonProps } from '@/app/types';

export default function Button({ 
  onClick, 
  isOpen, 
  children 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-2 rounded-full text-sm font-medium
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-400
        ${isOpen 
          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
      `}
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Sembunyikan tabel' : 'Tampilkan tabel'}
    >
      {children || (isOpen ? 'Show Less' : 'Read More')}
    </button>
  );
}