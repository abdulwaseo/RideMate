import React from 'react';
import { Calendar, Eye, Users, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 text-left space-y-12">
      {/* Page Heading */}
      <div className="space-y-4">
        <Badge variant="primary">Our Mission</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text">
          About RideMate
        </h1>
        <p className="text-base md:text-lg text-brand-textMuted max-w-2xl leading-relaxed">
          Connecting Dilkusha Towers' commuting professionals to build a safer, cheaper, and greener corporate network in Karachi.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverEffect={false} className="border border-brand-border/40 p-8 space-y-4">
          <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary w-fit">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-brand-text">Corporate Synergy</h3>
          <p className="text-sm text-brand-textMuted leading-relaxed">
            Commuting with people working in your office or building helps form high-quality social interactions and fosters professional networking.
          </p>
        </Card>

        <Card hoverEffect={false} className="border border-brand-border/40 p-8 space-y-4">
          <div className="p-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent w-fit">
            <Eye className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-bold text-brand-text">Verified Circles</h3>
          <p className="text-sm text-brand-textMuted leading-relaxed">
            By limiting membership to validated work domains, RideMate establishes a baseline of trust and mutual accountability.
          </p>
        </Card>
      </div>

      {/* Coming Soon Alert Card */}
      <Card accent="primary" hoverEffect={false} className="p-8 md:p-10 text-center space-y-5">
        <div className="mx-auto p-3.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary w-fit">
          <Calendar className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-brand-text">Platform Deep-Dive</h3>
          <p className="text-sm text-brand-textMuted max-w-md mx-auto leading-relaxed">
            Detailed company profiles, leadership highlights, and commuter testimonies are currently in development.
          </p>
        </div>

        <div className="pt-2">
          <Badge variant="accent">Phase 2 Target: August 2026</Badge>
        </div>

        <div className="pt-4 flex items-center justify-center">
          <Link to={ROUTES.HOME}>
            <Button variant="glass" rightIcon={<ChevronRight className="h-4 w-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
