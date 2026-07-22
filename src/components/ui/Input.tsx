import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, containerClassName, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

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
            className={cn(
              "w-full px-4 py-3 bg-brand-surface border border-brand-border rounded-xl text-brand-text text-sm transition-all focus:outline-none placeholder:text-brand-muted/70",
              "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:shadow-glow",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20 focus:shadow-none",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-brand-muted pointer-events-none flex items-center justify-center">
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
