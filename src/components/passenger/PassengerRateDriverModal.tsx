import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StarRating } from '../ui/StarRating';
import { getAuthToken } from '../../utils/token';
import { API_V1_URL } from '../../config/api';

interface PassengerRateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  driverId: string;
  driverName: string;
  routeName?: string;
  onSubmitted?: () => void;
}

export const PassengerRateDriverModal: React.FC<PassengerRateDriverModalProps> = ({
  isOpen,
  onClose,
  rideId,
  driverId,
  driverName,
  routeName,
  onSubmitted,
}) => {
  const [score, setScore] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!rideId || !driverId || score === 0) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getAuthToken();
      const res = await fetch(`${API_V1_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ride_id: rideId,
          reviewee_id: driverId,
          score,
          review: review.trim() || undefined,
        }),
      });

      if (res.ok || res.status === 409) {
        setIsDone(true);
        setTimeout(() => {
          setIsDone(false);
          onSubmitted?.();
          onClose();
        }, 1200);
      } else {
        onClose();
      }
    } catch (err) {
      console.warn('[PassengerRateDriverModal] Submit error:', err);
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
                      <span>Commute Successful! 🎉</span>
                    </h3>
                    <p className="text-xs text-brand-textMuted mt-0.5">
                      How was your carpool experience with {driverName || 'your driver'}?
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
                    <h4 className="text-sm font-bold text-brand-text">Rating Received!</h4>
                    <p className="text-xs text-brand-textMuted">Thank you for rating your driver.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-bold text-base text-brand-primaryLight">
                        {driverName
                          ? driverName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                          : 'D'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-brand-text">{driverName}</h4>
                        {routeName && <p className="text-xs text-brand-textMuted">{routeName}</p>}
                        <span className="text-[10px] text-brand-primaryLight font-semibold">Dilkusha Verified Driver</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-center py-2">
                      <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">
                        Tap Stars to Rate
                      </span>
                      <div className="flex justify-center">
                        <StarRating value={score} onChange={setScore} size="lg" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-brand-textMuted font-medium block">
                        Optional Feedback / Compliment
                      </label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Punctual driver, clean car, smooth ride..."
                        rows={2}
                        maxLength={500}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-brand-border bg-white/[0.02] text-brand-text placeholder:text-brand-muted/50 focus:border-brand-primary focus:outline-none resize-none"
                      />
                    </div>
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
                      Submit Feedback
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
