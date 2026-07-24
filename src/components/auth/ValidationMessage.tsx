import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ValidationMessageProps {
  message?: string;
  variant?: 'error' | 'success';
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ message, variant = 'error' }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "p-3.5 rounded-xl border flex gap-3 text-xs font-semibold leading-normal text-left items-start select-none",
            variant === 'error'
              ? "bg-red-500/10 border-red-500/25 text-red-400"
              : "bg-brand-primary/10 border-brand-primary/25 text-brand-primaryLight"
          )}
        >
          {variant === 'error' ? (
            <AlertCircle className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4.5 w-4.5 text-brand-primaryLight flex-shrink-0 mt-0.5" />
          )}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
