import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const iconMap = {
    primary: <Info className="h-6 w-6 text-brand-primaryLight" />,
    success: <CheckCircle2 className="h-6 w-6 text-brand-successLight" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-400" />,
    danger: <XCircle className="h-6 w-6 text-red-400" />,
    info: <Info className="h-6 w-6 text-sky-400" />,
  };

  const confirmColors = {
    primary: 'bg-brand-primary text-brand-bg hover:bg-brand-primaryLight',
    success: 'bg-brand-success text-brand-bg hover:bg-brand-successLight',
    warning: 'bg-amber-500 text-brand-bg hover:bg-amber-400',
    danger: 'bg-red-500 text-white hover:bg-red-400',
    info: 'bg-sky-500 text-brand-bg hover:bg-sky-400',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md select-none focus:outline-none"
              tabIndex={-1}
            >
              <Card hoverEffect={false} className="border border-brand-border bg-brand-card/95 shadow-glass p-6 text-left relative space-y-4">
                
                {/* Header toolbar */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 rounded-xl bg-white/[0.01] border border-brand-border/40 shrink-0">
                      {iconMap[variant]}
                    </div>
                    <h3 id="dialog-title" className="text-base font-extrabold text-brand-text">
                      {title}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-brand-muted hover:text-brand-text hover:bg-white/[0.02] transition-all shrink-0"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Message descriptions */}
                <p className="text-xs text-brand-textMuted leading-relaxed">
                  {message}
                </p>

                {/* Buttons block */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="glass"
                    onClick={onClose}
                    disabled={isLoading}
                    className="hover:border-brand-border"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    isLoading={isLoading}
                    className={cn("font-bold px-5", confirmColors[variant])}
                  >
                    {confirmText}
                  </Button>
                </div>

              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
export default Dialog;
