import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: 'none' | 'primary' | 'accent';
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  accent = 'none',
  className,
}) => {
  return (
    <Card
      accent={accent}
      className={cn("flex flex-col text-left group", className)}
    >
      <div className={cn(
        "p-3.5 rounded-2xl w-fit mb-5 transition-colors border",
        accent === 'primary' 
          ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primaryLight group-hover:bg-brand-primary/20" 
          : accent === 'accent'
            ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accentLight group-hover:bg-brand-accent/20"
            : "bg-white/[0.02] border-brand-border/40 text-brand-textMuted group-hover:text-brand-primaryLight group-hover:border-brand-primary/20"
      )}>
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-xl font-bold text-brand-text mb-2.5 tracking-tight group-hover:text-brand-primaryLight transition-colors">
        {title}
      </h3>
      
      <p className="text-sm text-brand-textMuted leading-relaxed">
        {description}
      </p>
    </Card>
  );
};
