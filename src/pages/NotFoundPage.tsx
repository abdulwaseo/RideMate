import React from 'react';
import { ShieldX, Home } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-8 select-none">
      
      {/* 404 Icon Accent */}
      <div className="mx-auto p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 w-fit animate-pulse">
        <ShieldX className="h-10 w-10" />
      </div>

      <div className="space-y-3">
        <span className="text-sm font-bold tracking-widest text-red-400 uppercase">
          Error 404
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text">
          Route Not Found
        </h1>
        <p className="text-sm text-brand-textMuted leading-relaxed">
          The commute path or page you are requesting doesn't exist or has been shifted in Karachi's digital transit grid.
        </p>
      </div>

      <Card hoverEffect={false} className="border border-brand-border/40 p-5 text-xs text-brand-muted bg-white/[0.01]">
        If you believe this route should exist, contact the Dilkusha commuter coordinator at support@ridemate.pk
      </Card>

      <div className="flex justify-center">
        <Link to={ROUTES.HOME}>
          <Button variant="primary" leftIcon={<Home className="h-4 w-4" />}>
            Back to Home Route
          </Button>
        </Link>
      </div>
    </div>
  );
};
