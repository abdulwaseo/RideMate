import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputFilter?: 'name' | 'mobile' | 'cnic' | 'numeric';
}

const formatCNIC = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, containerClassName, id, inputFilter, onKeyDown, onBeforeInput, onChange, inputMode, maxLength, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (onKeyDown) onKeyDown(e);
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length > 1) return; // Allow navigation keys (Backspace, Tab, Enter, Arrows, Delete)

      if (inputFilter === 'name') {
        if (!/^[a-zA-Z\s'.-]$/.test(e.key)) {
          e.preventDefault();
        }
      } else if (inputFilter === 'mobile' || inputFilter === 'cnic' || inputFilter === 'numeric') {
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      }
    };

    const handleBeforeInput = (e: React.FormEvent<HTMLInputElement> & { data?: string }) => {
      if (onBeforeInput) (onBeforeInput as any)(e);
      if (e.defaultPrevented) return;
      const inputData = e.data;
      if (!inputData) return;

      if (inputFilter === 'name') {
        if (!/^[a-zA-Z\s'.-]+$/.test(inputData)) {
          e.preventDefault();
        }
      } else if (inputFilter === 'mobile' || inputFilter === 'cnic' || inputFilter === 'numeric') {
        if (!/^\d+$/.test(inputData)) {
          e.preventDefault();
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (inputFilter === 'cnic') {
        e.target.value = formatCNIC(e.target.value);
      }
      if (onChange) onChange(e);
    };

    const effectiveInputMode = inputMode || (inputFilter === 'mobile' || inputFilter === 'cnic' || inputFilter === 'numeric' ? 'numeric' : undefined);
    const effectiveMaxLength = maxLength || (inputFilter === 'mobile' ? 11 : inputFilter === 'cnic' ? 15 : undefined);

    return (
      <div className={cn("flex flex-col gap-1.5 w-full text-left", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase">
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-brand-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            inputMode={effectiveInputMode}
            maxLength={effectiveMaxLength}
            onKeyDown={handleKeyDown}
            onBeforeInput={handleBeforeInput}
            onChange={handleChange}
            className={cn(
              "w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-slate-900 text-sm font-medium transition-all focus:outline-none placeholder:text-slate-400",
              "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:shadow-[0_0_12px_rgba(16,185,129,0.12)]",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:shadow-none",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-brand-muted flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <span className="text-xs text-red-400 font-medium mt-0.5">
            {error}
          </span>
        )}
        
        {!error && helperText && (
          <span className="text-xs text-brand-muted mt-0.5">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
