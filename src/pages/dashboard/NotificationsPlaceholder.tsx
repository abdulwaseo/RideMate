import React from 'react';
import { Bell } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const NotificationsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-8 text-left select-none max-w-3xl">
      <PageHeader 
        title="Notifications" 
        description="Stay updated with instant booking requests, ride approvals, and route alerts."
      />

      <Card hoverEffect={false} className="border border-dashed border-brand-border p-12 text-center bg-brand-card/10 space-y-5">
        <div className="mx-auto p-4 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary w-fit">
          <Bell className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-brand-text">Commuter Alerts</h3>
          <p className="text-sm text-brand-textMuted max-w-sm mx-auto leading-relaxed">
            Real-time visual notifications and email integrations are locked.
          </p>
        </div>

        <Badge variant="primary">Notifications will be implemented in Sprint 7</Badge>
      </Card>
    </div>
  );
};

export default NotificationsPlaceholder;
