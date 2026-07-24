import React from 'react';
import { ShieldAlert, Home } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Page403: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-8 select-none text-left">
      
      {/* 403 Icon Accent */}
      <div className="mx-auto p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit animate-pulse">
        <ShieldAlert className="h-10 w-10" />
      </div>

      <div className="space-y-3 text-center">
        <span className="text-sm font-bold tracking-widest text-amber-400 uppercase">
          Access Forbidden (403)
        </span>
        <h1 className="text-3xl font-extrabold text-brand-text">
          Unauthorized Access
        </h1>
        <p className="text-xs text-brand-textMuted leading-relaxed">
          You do not have the necessary driver or passenger role permissions to access this commute dashboard route.
        </p>
      </div>

      <Card hoverEffect={false} className="border border-brand-border/40 p-5 text-center text-xs text-brand-muted bg-white/[0.01]">
        If you need to change your registered coworker role credentials, please adjust them in select-role settings or email admin.
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="glass" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" leftIcon={<Home className="h-4 w-4" />} onClick={() => navigate('/')}>
          Home
        </Button>
      </div>
    </div>
  );
};
export default Page403;
