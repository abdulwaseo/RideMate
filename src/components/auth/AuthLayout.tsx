import React from 'react';
import { Logo } from '../ui/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-brand-bg relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden select-none bg-grid">
      {/* Decorative backdrop light blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        {/* Centered Logo */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-brand-textMuted max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
};
