import React, { useState } from 'react';
import { Star, CheckCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StarRating } from '../ui/StarRating';
import { getAuthToken } from '../../utils/token';
import { API_V1_URL } from '../../config/api';

export interface PassengerToRate {
  id: string; // passenger user id
  name: string;
  avatarUrl?: string;
}

interface DriverRatePassengersModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  passengers: PassengerToRate[];
  onSubmitted?: () => void;
}

export const DriverRatePassengersModal: React.FC<DriverRatePassengersModalProps> = ({
  isOpen,
  onClose,
  rideId,
  passengers,
  onSubmitted,
}) => {
  const [ratingsMap, setRatingsMap] = useState<Record<string, number>>({});
  const [reviewsMap, setReviewsMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleScoreChange = (passengerId: string, score: number) => {
    setRatingsMap((prev) => ({ ...prev, [passengerId]: score }));
  };

  const handleSubmit = async () => {
    const payloadItems = Object.entries(ratingsMap)
      .filter(([_, score]) => score > 0)
      .map(([passengerId, score]) => ({
        ride_id: rideId,
        reviewee_id: passengerId,
        score,
        review: reviewsMap[passengerId] || undefined,
      }));

    if (payloadItems.length === 0) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const res = await fetch(`${API_V1_URL}/ratings/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ ratings: payloadItems }),
      });

      if (res.ok) {
        setIsDone(true);
        setTimeout(() => {
          setIsDone(false);
          onSubmitted?.();
          onClose();
        }, 1200);
      } else {
        for (const item of payloadItems) {
          await fetch(`${API_V1_URL}/ratings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(item),
          });
        }
        setIsDone(true);
        setTimeout(() => {
          setIsDone(false);
          onSubmitted?.();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.warn('[DriverRatePassengersModal] Submit error:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md select-none focus:outline-none"
            >
              <Card hoverEffect={false} className="border border-brand-border bg-brand-card/95 shadow-glass p-6 text-left relative space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
                  <div>
                    <h3 className="text-base font-extrabold text-brand-text flex items-center gap-2">
                      <span>Rate Your Passengers</span>
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    </h3>
                    <p className="text-xs text-brand-textMuted mt-0.5">
                      Commute complete! Feedback helps maintain trust in the Dilkusha community.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-white/[0.05]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {isDone ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent flex items-center justify-center mx-auto">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                    <h4 className="text-sm font-bold text-brand-text">Thank You for Your Feedback!</h4>
                    <p className="text-xs text-brand-textMuted">Ratings submitted & profile scores updated.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-2 max-h-[55vh] overflow-y-auto">
                    {passengers.length > 0 ? (
                      passengers.map((passenger) => {
                        const currentScore = ratingsMap[passenger.id] || 0;
                        return (
                          <div
                            key={passenger.id}
                            className="p-4 rounded-xl border border-brand-border/40 bg-white/[0.01] space-y-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-bold text-sm text-brand-primaryLight">
                                {passenger.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-brand-text">{passenger.name}</h4>
                                <span className="text-[10px] text-brand-textMuted">Passenger</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-brand-muted font-medium">Rating:</span>
                              <StarRating
                                value={currentScore}
                                onChange={(score) => handleScoreChange(passenger.id, score)}
                                size="md"
                              />
                            </div>

                            <input
                              type="text"
                              value={reviewsMap[passenger.id] || ''}
                              onChange={(e) => setReviewsMap((prev) => ({ ...prev, [passenger.id]: e.target.value }))}
                              placeholder="Optional note / feedback..."
                              maxLength={200}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-brand-border/60 bg-white/[0.02] text-brand-text placeholder:text-brand-muted/50 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-brand-muted text-center py-6">
                        No active passengers logged for this commute.
                      </p>
                    )}
                  </div>
                )}

                {!isDone && (
                  <div className="pt-3 border-t border-brand-border/40 flex justify-between gap-3">
                    <Button variant="glass" size="sm" onClick={onClose} disabled={isSubmitting}>
                      Skip for Now
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSubmit}
                      isLoading={isSubmitting}
                    >
                      Submit Ratings
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
