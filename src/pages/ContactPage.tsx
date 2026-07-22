import React from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const ContactPage: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="max-w-5xl mx-auto py-10 text-left space-y-12">
      {/* Page Heading */}
      <div className="space-y-4">
        <Badge variant="accent">Get in Touch</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text">
          Contact RideMate
        </h1>
        <p className="text-base md:text-lg text-brand-textMuted max-w-2xl leading-relaxed">
          Have questions about employee verification or group routes? Reach out and we will help you get connected.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Contact Information Cards */}
        <div className="lg:col-span-1 space-y-6">
          <Card hoverEffect={false} className="border border-brand-border/40 p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex-shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-brand-text mb-1">Email Support</h4>
              <p className="text-sm text-brand-textMuted">support@ridemate.pk</p>
              <p className="text-xs text-brand-muted mt-0.5">Response within 24 hours</p>
            </div>
          </Card>

          <Card hoverEffect={false} className="border border-brand-border/40 p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex-shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-brand-text mb-1">Call Support</h4>
              <p className="text-sm text-brand-textMuted">+92 (21) 111-RIDE</p>
              <p className="text-xs text-brand-muted mt-0.5">Mon - Fri, 9:00 AM - 6:00 PM</p>
            </div>
          </Card>

          <Card hoverEffect={false} className="border border-brand-border/40 p-6 flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex-shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-brand-text mb-1">Office Location</h4>
              <p className="text-sm text-brand-textMuted">Dilkusha Towers, Karachi</p>
              <p className="text-xs text-brand-muted mt-0.5">Tariq Road, PECHS Block 2</p>
            </div>
          </Card>
        </div>

        {/* Right Side: Contact Form Placeholder */}
        <div className="lg:col-span-2">
          <Card hoverEffect={false} className="border border-brand-border/50 p-8 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-brand-border/40">
              <HelpCircle className="h-5 w-5 text-brand-primary" />
              <h3 className="text-lg font-bold text-brand-text">Send Us a Message</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="e.g. Abdul" />
                <Input label="Last Name" placeholder="e.g. Waseo" />
              </div>
              <Input label="Work Email Address" type="email" placeholder="e.g. name@company.com" />
              <div className="flex flex-col gap-1.5 w-full text-left">
                <label className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase">
                  How can we help?
                </label>
                <textarea 
                  rows={4}
                  placeholder="Tell us about your route or general questions..."
                  className="w-full px-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm transition-all focus:outline-none placeholder:text-brand-muted/70 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:shadow-glow resize-none"
                />
              </div>
              
              <div className="pt-2 flex justify-end">
                <Button variant="primary" rightIcon={<Send className="h-4.5 w-4.5" />}>
                  Send Query
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
