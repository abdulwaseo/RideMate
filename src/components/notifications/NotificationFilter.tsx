import React from 'react';
import type { NotificationCategory } from '../../contexts/NotificationContext';

const CATEGORIES: (NotificationCategory | 'All')[] = [
  'All',
  'Ride',
  'Booking',
  'Chat',
  'Driver',
  'System',
  'Security',
];

interface NotificationFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  className?: string;
}

export const NotificationFilter: React.FC<NotificationFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              isSelected
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                : 'bg-brand-surface border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
