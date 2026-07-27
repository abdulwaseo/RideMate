import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Bell, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ToastItem } from '../../contexts/ToastContext';
import { cn } from '../../utils/cn';

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, type, title, description, onClick } = toast;

  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    info: <Bell className="h-5 w-5 text-amber-400 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-[#16251e]/95 text-emerald-50 border-l-4 border-l-emerald-400',
    error: 'border-rose-500/30 bg-[#25161a]/95 text-rose-50 border-l-4 border-l-rose-400',
    warning: 'border-amber-500/30 bg-[#252016]/95 text-amber-50 border-l-4 border-l-amber-400',
    info: 'border-amber-500/30 bg-[#1c1829]/95 text-slate-100 border-l-4 border-l-amber-400 shadow-2xl',
  };

  const handleToastClick = () => {
    if (onClick) {
      onClick();
      onDismiss(id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, y: 0, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={handleToastClick}
      className={cn(
        "flex gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl w-full max-w-sm relative text-left overflow-hidden z-[9999]",
        onClick ? "cursor-pointer hover:scale-[1.02] transition-transform" : "",
        borderColors[type]
      )}
    >
      {/* Toast Icon */}
      {iconMap[type]}

      {/* Toast Content */}
      <div className="flex-1 space-y-0.5 select-none pr-4">
        <h4 className="text-xs font-bold leading-snug text-white flex items-center justify-between">
          <span>{title}</span>
          {onClick && (
            <span className="text-[9px] uppercase tracking-wider text-amber-400 font-extrabold ml-2 shrink-0">
              View
            </span>
          )}
        </h4>
        <p className="text-[11px] text-slate-300 leading-normal font-medium">{description}</p>
      </div>

      {/* Manual Dismiss Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(id);
        }}
        className="text-white/40 hover:text-white/80 transition-colors shrink-0 self-start p-0.5"
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
