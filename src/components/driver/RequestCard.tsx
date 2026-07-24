import React from 'react';
import { Check, X, Star, Users, MapPin, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { PassengerRequest } from '../../contexts/DriverContext';
import { cn } from '../../utils/cn';

interface RequestCardProps {
  request: PassengerRequest;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  className?: string;
  isActionable?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
  className,
  isActionable = true,
}) => {
  return (
    <Card hoverEffect={false} className={cn("border border-brand-border/40 text-left bg-brand-card/30 relative select-none", className)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* User profile info block */}
        <div className="flex items-center gap-3.5">
          <Avatar name={request.passengerName} size="md" />
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-brand-text leading-none">{request.passengerName}</h4>
              <div className="flex items-center gap-0.5 text-amber-400 text-xs font-semibold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{request.passengerRating}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-brand-textMuted leading-none">
              <MapPin className="h-3.5 w-3.5 text-brand-primary" />
              <span>{request.officeName}</span>
            </div>
          </div>
        </div>

        {/* Requests metadata details */}
        <div className="flex items-center gap-4 sm:text-right text-xs text-brand-textMuted">
          <div className="flex items-center gap-1.5">
            <Users className="h-4.5 w-4.5 text-brand-muted" />
            <span>Seats: <strong className="text-brand-text">{request.requestedSeats}</strong></span>
          </div>
          <span className="h-3 w-px bg-brand-border/80" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-4.5 w-4.5 text-brand-muted" />
            <span>{request.requestTime}</span>
          </div>
        </div>
      </div>

      {/* Action triggers */}
      {isActionable && request.status === 'Pending' && (
        <div className="mt-5 pt-4 border-t border-brand-border/40 flex justify-end gap-2.5">
          {onReject && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onReject(request.id)}
              className="bg-transparent border border-red-500/25 text-red-400 hover:bg-red-500/10 font-bold"
              leftIcon={<X className="h-4 w-4" />}
            >
              Reject
            </Button>
          )}

          {onAccept && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAccept(request.id)}
              className="font-bold"
              leftIcon={<Check className="h-4 w-4" />}
            >
              Accept Request
            </Button>
          )}
        </div>
      )}

      {/* Render Badge overlay status if request status is not Pending */}
      {request.status !== 'Pending' && (
        <div className="mt-4 pt-3 border-t border-brand-border/30 flex justify-end">
          <Badge variant={request.status === 'Accepted' ? 'success' : 'muted'}>
            {request.status}
          </Badge>
        </div>
      )}
    </Card>
  );
};
