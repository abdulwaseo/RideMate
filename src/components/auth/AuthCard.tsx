import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, className }) => {
  return (
    <Card
      hoverEffect={false}
      className={cn(
        "border border-brand-border bg-brand-card shadow-glass p-6 sm:p-8 rounded-2xl relative overflow-hidden backdrop-blur-glass",
        className
      )}
    >
      {/* Decorative internal card ambient lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />
      
      {children}
    </Card>
  );
};
