import React from 'react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Crown, User } from 'lucide-react';
import type { Participant } from '../../contexts/CommunicationContext';

interface ParticipantListProps {
  participants: Participant[];
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  // Sort participants so driver always comes first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === 'driver') return -1;
    if (b.role === 'driver') return 1;
    return 0;
  });

  return (
    <div className="space-y-4 select-none text-left">
      <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider border-b border-brand-border/40 pb-2 mb-3">
        Participants ({participants.length})
      </h3>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {sortedParticipants.map((p) => {
          const isDriver = p.role === 'driver';
          
          return (
            <div 
              key={p.id}
              className="flex items-center justify-between p-2 rounded-xl border border-brand-border/20 bg-brand-card/10"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={p.name} size="sm" />
                <span className="text-xs font-bold text-brand-text truncate max-w-[120px]">
                  {p.name}
                </span>
              </div>

              {isDriver ? (
                <Badge variant="primary" className="text-[8px] flex items-center gap-1 py-0.5 px-2 font-bold select-none uppercase">
                  <Crown className="h-2.5 w-2.5" />
                  <span>Admin</span>
                </Badge>
              ) : (
                <Badge variant="muted" className="text-[8px] flex items-center gap-1 py-0.5 px-2 font-bold select-none uppercase">
                  <User className="h-2.5 w-2.5" />
                  <span>Passenger</span>
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ParticipantList;
