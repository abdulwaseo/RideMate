import React from 'react';
import { MessageSquare } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const PassengerChatPlaceholder: React.FC = () => {
  return (
    <div className="space-y-8 text-left select-none max-w-3xl">
      <PageHeader 
        title="Chat Messenger" 
        description="Connect and coordinate in real-time with accepted carpool drivers."
      />

      <Card hoverEffect={false} className="border border-dashed border-brand-border p-12 text-center bg-brand-card/10 space-y-5">
        <div className="mx-auto p-4 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent w-fit">
          <MessageSquare className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-brand-text">Commuter Chats</h3>
          <p className="text-sm text-brand-textMuted max-w-sm mx-auto leading-relaxed">
            Direct instant messaging and group coordinate chats are locked.
          </p>
        </div>

        <Badge variant="primary">Temporary Ride Chat will be implemented in Sprint 6</Badge>
      </Card>
    </div>
  );
};

export default PassengerChatPlaceholder;
