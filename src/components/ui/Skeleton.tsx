import React from 'react';
import { Card } from './Card';

export const RideCardSkeleton: React.FC = () => {
  return (
    <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/10 p-5 space-y-4 animate-pulse h-48 select-none text-left">
      <div className="flex justify-between border-b border-brand-border/30 pb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/4 bg-white/[0.05] rounded" />
          <div className="h-3.5 w-1/2 bg-white/[0.05] rounded" />
        </div>
        <div className="h-8 w-16 bg-white/[0.05] rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-3/4 bg-white/[0.05] rounded" />
        <div className="h-3 w-2/3 bg-white/[0.05] rounded" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 w-24 bg-white/[0.05] rounded" />
        <div className="h-8 w-20 bg-white/[0.05] rounded" />
      </div>
    </Card>
  );
};

export const ChatSkeleton: React.FC = () => {
  return (
    <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/10 p-4.5 flex gap-4 items-center animate-pulse h-20 text-left select-none">
      <div className="h-11 w-11 rounded-full bg-white/[0.05]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-white/[0.05] rounded" />
        <div className="h-3 w-1/2 bg-white/[0.05] rounded" />
      </div>
      <div className="h-3 w-8 bg-white/[0.05] rounded" />
    </Card>
  );
};

export const NotificationSkeleton: React.FC = () => {
  return (
    <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/10 p-4.5 flex gap-4 items-start animate-pulse h-24 text-left select-none">
      <div className="h-9 w-9 rounded-xl bg-white/[0.05]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-12 bg-white/[0.05] rounded" />
        <div className="h-4 w-1/3 bg-white/[0.05] rounded" />
        <div className="h-3 w-3/4 bg-white/[0.05] rounded" />
      </div>
      <div className="h-6 w-6 bg-white/[0.05] rounded" />
    </Card>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse select-none text-left">
      <div className="flex flex-col sm:flex-row gap-5 items-center pb-6 border-b border-brand-border/30">
        <div className="h-20 w-20 rounded-full bg-white/[0.05]" />
        <div className="space-y-2 flex-1 text-center sm:text-left">
          <div className="h-5 w-40 bg-white/[0.05] rounded mx-auto sm:mx-0" />
          <div className="h-3.5 w-60 bg-white/[0.05] rounded mx-auto sm:mx-0" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/10 p-5 space-y-4 h-48">
          <div className="h-4 w-1/4 bg-white/[0.05] rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/[0.05] rounded" />
            <div className="h-3 w-3/4 bg-white/[0.05] rounded" />
          </div>
        </Card>
        <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/10 p-5 space-y-4 h-48">
          <div className="h-4 w-1/4 bg-white/[0.05] rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-white/[0.05] rounded" />
            <div className="h-3 w-3/4 bg-white/[0.05] rounded" />
          </div>
        </Card>
      </div>
    </div>
  );
};
