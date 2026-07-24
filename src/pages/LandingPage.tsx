import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  Leaf, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Clock, 
  TrendingUp 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { Section } from '../components/ui/Section';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { FeatureCard } from '../components/ui/FeatureCard';
import { ROUTES } from '../constants/routes';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  return (
    <div className="text-center relative select-none">
      
      {/* 1. Hero Section */}
      <Section showGrid={true} glow="both" className="pt-24 pb-20 md:py-32">
        <Container className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <Badge variant="primary" className="mb-2">
              Sprint 1 Launch • Karachi
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-brand-text leading-[1.1] max-w-4xl mx-auto">
              Smart Carpooling for <br />
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                Smarter Commutes
              </span>
            </h1>

            <p className="text-base sm:text-xl text-brand-textMuted max-w-2xl mx-auto leading-relaxed">
              Connect with fellow corporate professionals commuting to and from <strong>Dilkusha Towers</strong>. Reduce travel costs, network along the way, and help make Karachi greener.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to={ROUTES.FIND_RIDE} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Find a Ride
                </Button>
              </Link>
              <Link to={ROUTES.BECOME_DRIVER} className="w-full sm:w-auto">
                <Button variant="glass" size="lg" className="w-full sm:w-auto" leftIcon={<Car className="h-5 w-5 text-brand-accent" />}>
                  Become a Driver
                </Button>
              </Link>
            </div>

            {/* Micro visual: Dilkusha Towers Verified commute */}
            <div className="pt-10 flex items-center justify-center gap-6 text-xs text-brand-muted">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-brand-primary" />
                <span>Verified Office Emails Only</span>
              </div>
              <span className="h-3 w-px bg-brand-border" />
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4.5 w-4.5 text-brand-accent" />
                <span>Karachi Commute Corridor</span>
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* 2. Statistics Section */}
      <Section className="py-12 bg-white/[0.01] border-y border-brand-border/40">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Active Commuters" 
              value={1250} 
              suffix="+" 
              icon={Users} 
              description="Verified professionals sharing rides weekly" 
            />
            <StatCard 
              title="Commutes Complete" 
              value={8400} 
              suffix="+" 
              icon={Car} 
              description="Safe corridors driven in Karachi" 
            />
            <StatCard 
              title="CO₂ Emissions Saved" 
              value={12} 
              prefix="~" 
              suffix=" Tons" 
              icon={Leaf} 
              description="Environmental footprint offset" 
            />
            <StatCard 
              title="Average Fuel Saved" 
              value={35} 
              suffix="%" 
              icon={TrendingUp} 
              description="Commute budget kept in pocket" 
            />
          </div>
        </Container>
      </Section>

      {/* 3. How It Works Section */}
      <Section id="how-it-works" className="py-20 md:py-24">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="accent">Process Workflow</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text">
              How RideMate Works
            </h2>
            <p className="text-sm md:text-base text-brand-textMuted leading-relaxed">
              A seamless flow tailored specifically to match driver capacity with passenger demand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hoverEffect={false} className="text-left relative flex flex-col p-8 border border-brand-border/40">
              <div className="absolute top-6 right-6 text-6xl font-black text-white/[0.02]">01</div>
              <div className="h-10 w-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold mb-6">
                1
              </div>
              <h4 className="text-lg font-bold text-brand-text mb-2.5">Verify Identity</h4>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Sign up using your corporate email address to confirm your employment at Dilkusha Towers or adjacent offices.
              </p>
            </Card>

            <Card hoverEffect={false} className="text-left relative flex flex-col p-8 border border-brand-border/40">
              <div className="absolute top-6 right-6 text-6xl font-black text-white/[0.02]">02</div>
              <div className="h-10 w-10 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center font-bold mb-6">
                2
              </div>
              <h4 className="text-lg font-bold text-brand-text mb-2.5">Post / Search Route</h4>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Drivers define schedules and pick-up zones. Passengers enter commute windows to find matched routes instantly.
              </p>
            </Card>

            <Card hoverEffect={false} className="text-left relative flex flex-col p-8 border border-brand-border/40">
              <div className="absolute top-6 right-6 text-6xl font-black text-white/[0.02]">03</div>
              <div className="h-10 w-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center font-bold mb-6">
                3
              </div>
              <h4 className="text-lg font-bold text-brand-text mb-2.5">Match & Commute</h4>
              <p className="text-sm text-brand-textMuted leading-relaxed">
                Confirm matches, coordinate central stops, split fuel payouts, and share a comfortable, safe corporate drive.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* 4. Features Section */}
      <Section id="features" glow="emerald" className="py-20 md:py-24 bg-white/[0.005] border-t border-brand-border/40">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="primary">Features Suite</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-text">
              Platform Features
            </h2>
            <p className="text-sm md:text-base text-brand-textMuted leading-relaxed">
              Designed from the ground up for a secure, convenient, and reliable corporate travel experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={MapPin} 
              title="Corridor Route Matching" 
              description="Algorithm identifies optimal pickup points along major Karachi transit grids like Shahrah-e-Faisal and Tariq Road." 
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Verified Commuter Circle" 
              description="Exclusively restricted to verified corporate domains, ensuring passenger and driver safety." 
              accent="primary"
            />
            <FeatureCard 
              icon={DollarSign} 
              title="Smart Cost Splitting" 
              description="Fair pricing estimations based on actual commute distance, taking the negotiation out of carpooling." 
            />
            <FeatureCard 
              icon={Calendar} 
              title="Flexible Scheduling" 
              description="Plan single rides or set recurring commutes matching standard shift times at Dilkusha Towers." 
            />
            <FeatureCard 
              icon={Clock} 
              title="Real-Time Updates" 
              description="Interactive notifications showing route timing, status, and precise arrival estimations." 
              accent="accent"
            />
            <FeatureCard 
              icon={Users} 
              title="Commute Communities" 
              description="Join channels with staff from your same department or building blocks to share notes and network." 
            />
          </div>
        </Container>
      </Section>

      {/* 5. Call To Action (CTA) Section */}
      <Section className="py-20 md:py-28 relative">
        <Container className="max-w-4xl">
          <Card 
            hoverEffect={false} 
            className="p-8 md:p-14 text-center border border-brand-primary/20 bg-gradient-to-tr from-brand-surface to-[#0e172a]/80 shadow-glass-glow relative overflow-hidden"
          >
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand-primary/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-accent/5 blur-[80px]" />

            <div className="relative z-10 space-y-6">
              <Badge variant="primary">Join RideMate Today</Badge>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-brand-text max-w-xl mx-auto leading-tight">
                Ready to transform your daily commute?
              </h2>
              <p className="text-sm md:text-base text-brand-textMuted max-w-lg mx-auto leading-relaxed">
                Connect with coworkers, simplify your transportation logistics, and build valuable networks.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to={ROUTES.BECOME_DRIVER} className="w-full sm:w-auto">
                  <Button variant="glass" size="lg" className="w-full sm:w-auto">
                    Become a Driver
                  </Button>
                </Link>
                <Link to={ROUTES.FIND_RIDE} className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
                    Find a Ride
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

    </div>
  );
};
