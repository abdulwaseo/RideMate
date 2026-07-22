import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../utils/cn';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'About Us', path: ROUTES.ABOUT },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-brand-border/40 py-3.5 bg-brand-bg/75 backdrop-blur-glass">
      <Container className="flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={ROUTES.HOME} className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={cn(
                "text-sm font-semibold tracking-wide transition-colors",
                isActive(link.path)
                  ? "text-brand-primary"
                  : "text-brand-textMuted hover:text-brand-text"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth/Call-To-Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link to={ROUTES.BECOME_DRIVER}>
            <Button variant="glass" size="sm">
              Become a Driver
            </Button>
          </Link>
          <Link to={ROUTES.FIND_RIDE}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Find a Ride
            </Button>
          </Link>
          <span className="h-4 w-px bg-brand-border" />
          <Link to={ROUTES.DASHBOARD} className="text-sm font-semibold text-brand-accent hover:text-brand-accentLight transition-colors">
            Demo Portal
          </Link>
        </div>

        {/* Mobile Menu Hamburger button */}
        <div className="lg:hidden flex items-center gap-3">
          <Link to={ROUTES.DASHBOARD} className="text-xs font-semibold text-brand-accent border border-brand-accent/20 px-2.5 py-1.5 rounded-lg bg-brand-accent/5">
            Demo
          </Link>
          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg bg-white/[0.02] border border-brand-border text-brand-textMuted hover:text-brand-text focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-b border-brand-border/80 bg-brand-bg/95 backdrop-blur-xl py-6 px-4 flex flex-col gap-5 shadow-2xl">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-base font-semibold px-2 py-1.5 rounded-lg transition-colors text-left",
                  isActive(link.path)
                    ? "text-brand-primary bg-brand-primary/5"
                    : "text-brand-textMuted hover:text-brand-text"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-px bg-brand-border/40" />

          <div className="flex flex-col gap-3">
            <Link to={ROUTES.BECOME_DRIVER} onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="glass" size="md" className="w-full">
                Become a Driver
              </Button>
            </Link>
            <Link to={ROUTES.FIND_RIDE} onClick={() => setIsOpen(false)} className="w-full">
              <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Find a Ride
              </Button>
            </Link>
            <Link to={ROUTES.DASHBOARD} onClick={() => setIsOpen(false)} className="w-full text-center mt-2">
              <span className="text-sm font-semibold text-brand-accent hover:underline">
                Access Dashboard Demo
              </span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
