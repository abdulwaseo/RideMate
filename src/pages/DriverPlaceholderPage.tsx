import React from 'react';
import { ShieldAlert, Car, IdCard, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const DriverPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 text-center space-y-10">
      
      {/* Visual Accent */}
      <div className="mx-auto p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary w-fit">
        <Car className="h-10 w-10 animate-pulse" />
      </div>

      {/* Main Headers */}
      <div className="space-y-4">
        <Badge variant="primary">Become a Driver</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text max-w-xl mx-auto leading-tight">
          Publish Your Commute
        </h1>
        <p className="text-sm md:text-base text-brand-textMuted max-w-md mx-auto leading-relaxed">
          Share your route, fill empty car seats, offset high fuel costs, and make connections during your daily commute to Dilkusha Towers.
        </p>
      </div>

      {/* Details Box */}
      <Card hoverEffect={false} className="border border-brand-border/40 p-8 space-y-6 text-left max-w-xl mx-auto">
        <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-primary" />
          <span>Commuter Driver Requirements</span>
        </h3>
        
        <ul className="space-y-4">
          <li className="flex gap-3.5 items-start">
            <div className="p-1 rounded-md bg-brand-primary/10 text-brand-primary mt-0.5">
              <IdCard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-text uppercase tracking-wider">Employee Email Verification</p>
              <p className="text-xs text-brand-textMuted mt-0.5">Must verify using your verified office domain email (e.g. name@company.pk).</p>
            </div>
          </li>
          <li className="flex gap-3.5 items-start">
            <div className="p-1 rounded-md bg-brand-primary/10 text-brand-primary mt-0.5">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-text uppercase tracking-wider">Vehicle Validation</p>
              <p className="text-xs text-brand-textMuted mt-0.5">Provide standard registration plates and valid driver's license.</p>
            </div>
          </li>
        </ul>
      </Card>

      {/* Coming Soon status */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-brand-accent/20 bg-brand-accent/5 text-brand-accent text-xs font-semibold">
          <ShieldAlert className="h-4 w-4" />
          <span>Driver Registration Module - Coming Soon</span>
        </div>
        <p className="text-xs text-brand-muted">
          Our team is currently finalizing verification integrations. This feature launches in Sprint 2.
        </p>
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex items-center justify-center gap-4">
        <Link to={ROUTES.HOME}>
          <Button variant="glass">Back to Landing</Button>
        </Link>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="primary">Explore Demo Portal</Button>
        </Link>
      </div>
    </div>
  );
};
