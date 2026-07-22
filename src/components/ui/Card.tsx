import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

type CardAccent = 'none' | 'primary' | 'accent';

interface CardProps extends HTMLMotionProps<'div'> {
  accent?: CardAccent;
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  accent = 'none',
  hoverEffect = true,
  children,
  ...props
}) => {
  const accentClasses = {
    none: 'glass-card',
    primary: 'glass-card border-brand-primary/20 hover:border-brand-primary/45 shadow-glass-glow',
    accent: 'glass-card-accent border-brand-accent/20 hover:border-brand-accent/45 shadow-glass-glow',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4 } : undefined}
      className={cn(
        "rounded-2xl p-6 relative overflow-hidden",
        accentClasses[accent],
        className
      )}
      {...props}
    >
      {/* Absolute background accent lights if card is accented */}
      {accent === 'primary' && (
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-brand-primary/10 blur-[40px] pointer-events-none" />
      )}
      {accent === 'accent' && (
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-brand-accent/10 blur-[40px] pointer-events-none" />
      )}
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
