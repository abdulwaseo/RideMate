import React from 'react';
import { ServerCrash, Home } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Page500: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-8 select-none text-left">
      
      {/* 500 Icon Accent */}
      <div className="mx-auto p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 w-fit animate-pulse">
        <ServerCrash className="h-10 w-10" />
      </div>

      <div className="space-y-3 text-center">
        <span className="text-sm font-bold tracking-widest text-red-400 uppercase">
          Server Error (500)
        </span>
        <h1 className="text-3xl font-extrabold text-brand-text">
          Internal Connection Failure
        </h1>
        <p className="text-xs text-brand-textMuted leading-relaxed">
          The RideMate booking services encountered an unexpected crash. Our operations team has been notified.
        </p>
      </div>

      <Card hoverEffect={false} className="border border-brand-border/40 p-5 text-center text-xs text-brand-muted bg-white/[0.01]">
        Try refreshing the page corridor. If the error persists, please try again shortly.
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="glass" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
        <Button variant="primary" leftIcon={<Home className="h-4 w-4" />} onClick={() => navigate('/')}>
          Home
        </Button>
      </div>
    </div>
  );
};
export default Page500;
