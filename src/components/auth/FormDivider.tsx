import React from 'react';

interface FormDividerProps {
  text?: string;
}

export const FormDivider: React.FC<FormDividerProps> = ({ text = 'or' }) => {
  return (
    <div className="relative my-6 select-none">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-brand-border/40" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-brand-surface px-3.5 text-brand-textMuted tracking-wider font-semibold">
          {text}
        </span>
      </div>
    </div>
  );
};
