import React from 'react';
import { cn } from '../../utils/cn';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-sm',
    md: 'h-8 w-8 text-xl',
    lg: 'h-10 w-10 text-2xl',
  };

  const svgSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  return (
    <div className={cn("flex items-center gap-2.5 font-bold tracking-tight select-none", className)}>
      <div className="relative flex items-center justify-center">
        {/* Glow effect in background */}
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent opacity-60 blur-[3px]" />
        
        <svg
          width={svgSizes[size]}
          height={svgSizes[size]}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Logo path representing two paths merging together */}
          <path
            d="M6 26C6 26 12 21 16 16C20 11 26 6 26 6"
            stroke="url(#logo-grad-primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M6 6C6 6 12 11 16 16C20 21 26 26 26 26"
            stroke="url(#logo-grad-accent)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle
            cx="16"
            cy="16"
            r="3.5"
            fill="#ffffff"
            stroke="url(#logo-grad-primary)"
            strokeWidth="2.5"
          />
          <defs>
            <linearGradient id="logo-grad-primary" x1="6" y1="26" x2="26" y2="6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="1" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="logo-grad-accent" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0ea5e9" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span className={cn(
          "font-sans font-extrabold text-brand-text leading-none tracking-tight",
          sizeClasses[size].split(' ')[1]
        )}>
          Ride<span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">Mate</span>
        </span>
      )}
    </div>
  );
};
