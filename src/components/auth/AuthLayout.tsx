import React from 'react';
import { Logo } from '../ui/Logo';
import { Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/10 via-slate-50 to-slate-100/90 relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Soft ambient backdrop glowing mesh */}
      <div className="absolute top-[-15%] left-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-teal-500/15 via-emerald-400/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-sky-500/15 via-indigo-500/5 to-transparent blur-[140px] pointer-events-none" />
      
      {/* Geometric background dot matrix accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3.5">
        
        {/* Decorative Badge Above Logo */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-teal-500/20 text-[11px] font-semibold text-teal-700 shadow-xs backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-teal-500" />
          <span>Karachi Corporate Carpool Network</span>
        </div>

        {/* Centered Logo */}
        <div className="flex justify-center pt-1">
          <Logo size="lg" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
};
