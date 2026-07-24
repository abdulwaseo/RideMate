import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '../ui/Input';
import { StrengthMeter } from './StrengthMeter';
import { cn } from '../../utils/cn';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showStrength?: boolean;
  containerClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, showStrength = false, containerClassName, value, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowPassword(!showPassword);
    };

    const valueString = typeof value === 'string' ? value : '';

    return (
      <div className={cn("space-y-3.5 w-full", containerClassName)}>
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          label={label}
          error={error}
          leftIcon={<Lock className="h-4.5 w-4.5" />}
          rightIcon={
            <button
              onClick={toggleVisibility}
              tabIndex={-1}
              className="focus:outline-none p-1 rounded hover:bg-white/[0.04] text-brand-muted hover:text-brand-text transition-colors cursor-pointer flex items-center justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          value={value}
          onChange={onChange}
          {...props}
        />

        {showStrength && (
          <div className="pt-0.5">
            <StrengthMeter password={valueString} />
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
