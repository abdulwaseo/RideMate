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
        "border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.09)] p-8 sm:p-10 rounded-3xl relative overflow-hidden backdrop-blur-xl transition-all",
        className
      )}
    >
      {children}
    </Card>
  );
};
