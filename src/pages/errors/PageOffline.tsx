import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const PageOffline: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-8 select-none text-left">
      
      {/* Offline Icon Accent */}
      <div className="mx-auto p-4 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryLight w-fit animate-pulse">
        <WifiOff className="h-10 w-10" />
      </div>

      <div className="space-y-3 text-center">
        <span className="text-sm font-bold tracking-widest text-brand-primaryLight uppercase">
          Connection Offline
        </span>
        <h1 className="text-3xl font-extrabold text-brand-text">
          No Internet Connection
        </h1>
        <p className="text-xs text-brand-textMuted leading-relaxed">
          It looks like your connection has dropped. Please verify your local network settings or Karachi commuter signal status.
        </p>
      </div>

      <Card hoverEffect={false} className="border border-brand-border/40 p-5 text-center text-xs text-brand-muted bg-white/[0.01]">
        RideMate will re-sync active booking corridors automatically once network routes are restored.
      </Card>

      <div className="flex justify-center">
        <Button variant="primary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => window.location.reload()}>
          Check Connection
        </Button>
      </div>
    </div>
  );
};
export default PageOffline;
