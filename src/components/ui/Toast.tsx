import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ToastItem } from '../../contexts/ToastContext';
import { cn } from '../../utils/cn';

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, type, title, description } = toast;

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-400 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/35 bg-emerald-950/20 text-emerald-50',
    error: 'border-red-500/35 bg-red-950/20 text-red-50',
    warning: 'border-amber-500/35 bg-amber-950/20 text-amber-50',
    info: 'border-sky-500/35 bg-sky-950/20 text-sky-50',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, y: 0, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={cn(
        "flex gap-3 p-4 rounded-xl border backdrop-blur-md shadow-glass w-full max-w-sm relative text-left overflow-hidden z-[9999]",
        borderColors[type]
      )}
    >
      {/* Toast Icon */}
      {iconMap[type]}

      {/* Toast Content */}
      <div className="flex-1 space-y-0.5 select-none pr-4">
        <h4 className="text-xs font-bold leading-snug">{title}</h4>
        <p className="text-[11px] text-white/70 leading-normal font-medium">{description}</p>
      </div>

      {/* Manual Dismiss Button */}
      <button 
        onClick={() => onDismiss(id)}
        className="text-white/40 hover:text-white/80 transition-colors shrink-0 self-start"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>

    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
export default ToastContainer;
