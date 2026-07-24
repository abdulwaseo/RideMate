import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StrengthMeterProps {
  password?: string;
}

export const StrengthMeter: React.FC<StrengthMeterProps> = ({ password = '' }) => {
  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const strengthLabels = ['Empty', 'Weak', 'Weak', 'Fair', 'Strong'];
  const strengthColors = [
    'bg-white/[0.05]',
    'bg-red-500',
    'bg-red-500',
    'bg-amber-500',
    'bg-brand-primary',
  ];
  
  const labelColor = [
    'text-brand-muted',
    'text-red-400',
    'text-red-400',
    'text-amber-400',
    'text-brand-primaryLight',
  ];

  return (
    <div className="space-y-3.5 text-left select-none">
      {/* Dynamic indicator bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-brand-textMuted font-semibold uppercase tracking-wider">Password Strength</span>
          <span className={cn("font-bold transition-colors", labelColor[score])}>
            {password ? strengthLabels[score] : 'Required'}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "h-full rounded-full transition-all duration-300",
                index <= score ? strengthColors[score] : 'bg-white/[0.05]'
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1.5">
        {criteria.map((item, idx) => (
          <li
            key={idx}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              item.met ? "text-brand-primaryLight" : "text-brand-muted"
            )}
          >
            <div className={cn(
              "p-0.5 rounded-full border flex items-center justify-center",
              item.met ? "border-brand-primary/30 bg-brand-primary/10" : "border-white/[0.05] bg-white/[0.01]"
            )}>
              {item.met ? (
                <Check className="h-3 w-3 stroke-[3px]" />
              ) : (
                <X className="h-3 w-3 opacity-30" />
              )}
            </div>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
