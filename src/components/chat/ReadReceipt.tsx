import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface ReadReceiptProps {
  readCount?: number;
  readByMe?: boolean;
}

export const ReadReceipt: React.FC<ReadReceiptProps> = ({ readCount = 0 }) => {
  if (readCount > 0) {
    return <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline-block ml-1" />;
  }
  return <Check className="w-3.5 h-3.5 text-slate-400 inline-block ml-1" />;
};
