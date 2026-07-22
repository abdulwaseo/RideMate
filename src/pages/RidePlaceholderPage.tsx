import React from 'react';
import { Search, Compass, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const RidePlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-12 text-center space-y-10">
      
      {/* Visual Accent */}
      <div className="mx-auto p-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent w-fit">
        <Search className="h-10 w-10 animate-pulse" />
      </div>

      {/* Main Headers */}
      <div className="space-y-4">
        <Badge variant="accent">Find a Ride</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text max-w-xl mx-auto leading-tight">
          Book Your Commute Seat
        </h1>
        <p className="text-sm md:text-base text-brand-textMuted max-w-md mx-auto leading-relaxed">
          Skip crowded public transit, avoid high ride-hailing fees, and commute in comfort with verified professionals traveling your way.
        </p>
      </div>

      {/* Details Box */}
      <Card hoverEffect={false} className="border border-brand-border/40 p-8 space-y-6 text-left max-w-xl mx-auto">
        <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-accent" />
          <span>Commuter Seat Search Perks</span>
        </h3>
        
        <ul className="space-y-4">
          <li className="flex gap-3.5 items-start">
            <div className="p-1 rounded-md bg-brand-accent/10 text-brand-accent mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-text uppercase tracking-wider">Matched Pickup Zones</p>
              <p className="text-xs text-brand-textMuted mt-0.5">System suggests physical landmarks along standard commute routes in Karachi.</p>
            </div>
          </li>
          <li className="flex gap-3.5 items-start">
            <div className="p-1 rounded-md bg-brand-accent/10 text-brand-accent mt-0.5">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-text uppercase tracking-wider">Flexible Arrival Timings</p>
              <p className="text-xs text-brand-textMuted mt-0.5">Match with drivers scheduled to reach Dilkusha Towers before clock-in times.</p>
            </div>
          </li>
        </ul>
      </Card>

      {/* Coming Soon status */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-xs font-semibold">
          <ShieldAlert className="h-4 w-4" />
          <span>Ride Search Engine - Coming Soon</span>
        </div>
        <p className="text-xs text-brand-muted">
          We are deploying map indexing engines for Karachi PECHS corridors. This launches in Sprint 2.
        </p>
      </div>

      {/* Action CTA */}
      <div className="pt-2 flex items-center justify-center gap-4">
        <Link to={ROUTES.HOME}>
          <Button variant="glass">Back to Landing</Button>
        </Link>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="primary" className="bg-gradient-to-r from-brand-accent to-brand-accentDark text-brand-text">
            Explore Demo Portal
          </Button>
        </Link>
      </div>
    </div>
  );
};
