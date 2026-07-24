import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badgeText?: string;
  onClick?: () => void;
  accent?: 'primary' | 'accent' | 'none';
  className?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  badgeText,
  onClick,
  accent = 'none',
  className,
}) => {
  const accentClasses = {
    none: 'border-brand-border hover:border-brand-primary/20 bg-brand-card hover:bg-brand-cardHover',
    primary: 'border-brand-primary/25 hover:border-brand-primary/45 bg-brand-primary/5 hover:bg-brand-primary/10 shadow-glass-glow',
    accent: 'border-brand-accent/25 hover:border-brand-accent/45 bg-brand-accent/5 hover:bg-brand-accent/10 shadow-glass-glow',
  };

  const iconColors = {
    none: 'bg-white/[0.02] border-brand-border/40 text-brand-textMuted',
    primary: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primaryLight',
    accent: 'bg-brand-accent/10 border-brand-accent/20 text-brand-accentLight',
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer h-full text-left"
    >
      <Card
        hoverEffect={false}
        className={cn(
          "h-full border p-5 flex flex-col relative select-none",
          accentClasses[accent],
          className
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-xl border", iconColors[accent])}>
            <Icon className="h-5 w-5" />
          </div>
          
          {badgeText && (
            <Badge variant={accent === 'accent' ? 'accent' : 'primary'}>
              {badgeText}
            </Badge>
          )}
        </div>

        <h4 className={cn(
          "font-bold text-base mb-1 transition-colors",
          accent === 'primary' ? 'text-brand-primaryLight' : accent === 'accent' ? 'text-brand-accentLight' : 'text-brand-text'
        )}>
          {title}
        </h4>
        
        <p className="text-xs text-brand-textMuted leading-relaxed">
          {description}
        </p>
      </Card>
    </motion.div>
  );
};
