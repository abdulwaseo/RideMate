import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  max?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  readOnly = false,
  size = 'md',
  className,
}) => {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const currentDisplay = hoverVal !== null ? hoverVal : value;

  return (
    <div className={cn('flex items-center gap-1 select-none', className)}>
      {Array.from({ length: max }, (_, idx) => {
        const starNum = idx + 1;
        const isFilled = starNum <= currentDisplay;

        return (
          <button
            key={starNum}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(starNum)}
            onMouseEnter={() => !readOnly && setHoverVal(starNum)}
            onMouseLeave={() => !readOnly && setHoverVal(null)}
            className={cn(
              'transition-all duration-150 transform focus:outline-none',
              !readOnly && 'hover:scale-110 cursor-pointer',
              readOnly && 'cursor-default'
            )}
            aria-label={`Rate ${starNum} out of ${max} stars`}
          >
            <Star
              className={cn(
                starSizes[size],
                isFilled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'fill-transparent text-brand-muted/40 hover:text-amber-300/60'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
