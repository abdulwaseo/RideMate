import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  icon: Icon,
  title,
  description,
  isSelected = false,
  onClick,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer h-full"
    >
      <Card
        hoverEffect={false}
        className={cn(
          "h-full flex flex-col p-6 sm:p-8 text-left border relative overflow-hidden transition-all duration-300 select-none",
          isSelected
            ? "border-brand-primary bg-brand-primary/5 shadow-glass-glow"
            : "border-brand-border hover:border-brand-primary/30 bg-brand-card hover:bg-brand-cardHover",
          className
        )}
      >
        {/* Glow indicator if selected */}
        {isSelected && (
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-primary/10 blur-xl pointer-events-none" />
        )}

        <div className={cn(
          "p-3 rounded-2xl w-fit mb-5 border transition-all duration-300",
          isSelected
            ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
            : "bg-white/[0.02] border-brand-border/60 text-brand-textMuted"
        )}>
          <Icon className="h-6 w-6" />
        </div>

        <h3 className={cn(
          "text-xl font-bold mb-2 tracking-tight transition-colors",
          isSelected ? "text-brand-primaryLight" : "text-brand-text"
        )}>
          {title}
        </h3>
        
        <p className="text-sm text-brand-textMuted leading-relaxed">
          {description}
        </p>

        {/* Selection Dot */}
        <div className="mt-auto pt-6 flex justify-end">
          <div className={cn(
            "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300",
            isSelected
              ? "border-brand-primary bg-brand-primary"
              : "border-brand-border bg-white/[0.01]"
          )}>
            {isSelected && (
              <div className="w-1.5 h-1.5 rounded-full bg-brand-bg" />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
