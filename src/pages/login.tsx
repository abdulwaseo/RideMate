import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, LogIn, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { PasswordInput } from '../components/auth/PasswordInput';
import { ValidationMessage } from '../components/auth/ValidationMessage';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import { loginSchema } from '../utils/validation';
import type { LoginFormValues } from '../utils/validation';
import { ROUTES } from '../constants/routes';
import { cn } from '../utils/cn';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('passenger');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      mobileNumber: '',
      password: '',
      rememberMe: false,
    }
  });

  const fillDemoAccount = (demoRole: UserRole, mobile: string) => {
    setRole(demoRole);
    setValue('mobileNumber', mobile, { shouldValidate: true, shouldDirty: true });
    setValue('password', '123456789', { shouldValidate: true, shouldDirty: true });
    setErrorMsg(null);
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const success = await login(values.mobileNumber, values.password, role);
      if (success) {
        navigate(role === 'driver' ? ROUTES.DRIVER_DASHBOARD : ROUTES.PASSENGER_DASHBOARD, { replace: true });
      } else {
        setErrorMsg('Invalid mobile number or password. Please verify your credentials and try again.');
      }
    } catch (err) {
      setErrorMsg('Authentication error. Unable to connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    reset(); // Clear errors and values when switching roles
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Password recovery is coming soon in Sprint 3.');
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to coordinate carpools and track your daily schedules."
    >
      <div className="space-y-5">
        
        {/* Quick Demo Credentials Box */}
        <div className="p-3.5 rounded-xl bg-brand-surface/80 border border-brand-border/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-brand-text font-semibold">
            <span>🔑 Testing Credentials</span>
            <span className="text-[10px] bg-brand-accent/20 text-brand-accentLight px-2 py-0.5 rounded-full font-mono">Password: 123456789</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('driver', '03243633432')}
              className="text-left p-2 rounded-lg bg-brand-bg/60 border border-brand-border hover:border-brand-accent/50 transition-all text-brand-textMuted hover:text-brand-text"
            >
              <div className="font-medium text-brand-accentLight text-[11px] truncate">Abdul Waseo (Driver)</div>
              <div className="font-mono text-[10px] mt-0.5">03243633432</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('passenger', '03161108768')}
              className="text-left p-2 rounded-lg bg-brand-bg/60 border border-brand-border hover:border-brand-primary/50 transition-all text-brand-textMuted hover:text-brand-text"
            >
              <div className="font-medium text-brand-primaryLight text-[11px] truncate">Wasay (Pass 1)</div>
              <div className="font-mono text-[10px] mt-0.5">03161108768</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('passenger', '03332297246')}
              className="text-left p-2 rounded-lg bg-brand-bg/60 border border-brand-border hover:border-brand-primary/50 transition-all text-brand-textMuted hover:text-brand-text"
            >
              <div className="font-medium text-brand-primaryLight text-[11px] truncate">Wasi (Pass 2)</div>
              <div className="font-mono text-[10px] mt-0.5">03332297246</div>
            </button>
          </div>
        </div>

        {/* Role Toggle Switch */}
        <div className="p-1 rounded-xl bg-brand-surface border border-brand-border flex select-none">
          <button
            onClick={() => handleRoleChange('passenger')}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              role === 'passenger'
                ? "bg-brand-primary/10 border border-brand-primary/20 text-brand-primaryLight shadow-sm"
                : "text-brand-textMuted hover:text-brand-text border border-transparent"
            )}
          >
            Passenger Portal
          </button>
          <button
            onClick={() => handleRoleChange('driver')}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              role === 'driver'
                ? "bg-brand-accent/10 border border-brand-accent/20 text-brand-accentLight shadow-sm"
                : "text-brand-textMuted hover:text-brand-text border border-transparent"
            )}
          >
            Driver Portal
          </button>
        </div>

        {/* Global form errors */}
        <ValidationMessage message={errorMsg || undefined} variant="error" />

        <AuthCard>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Mobile input */}
            <Input
              label="Mobile Number"
              placeholder="e.g. 03001234567"
              leftIcon={<Phone className="h-4.5 w-4.5" />}
              error={errors.mobileNumber?.message}
              disabled={isSubmitting}
              {...register('mobileNumber')}
            />

            {/* Password input */}
            <PasswordInput
              label="Password"
              placeholder="Enter your security password"
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
            />

            {/* Form actions row */}
            <div className="flex items-center justify-between text-xs py-1.5 select-none">
              <label className="flex items-center gap-2 text-brand-textMuted font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary h-4 w-4"
                  disabled={isSubmitting}
                  {...register('rememberMe')}
                />
                <span>Remember Me</span>
              </label>
              
              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-brand-accent hover:text-brand-accentLight hover:underline font-semibold"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant={role === 'driver' ? 'secondary' : 'primary'}
              className="w-full mt-2"
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<LogIn className="h-4.5 w-4.5" />}
            >
              Sign In
            </Button>
          </form>
        </AuthCard>

        {/* Register navigation link */}
        <div className="text-center text-xs text-brand-muted select-none pt-1">
          Don't have an account?{' '}
          <button
            onClick={() => navigate(ROUTES.SELECT_ROLE)}
            className="font-bold text-brand-accent hover:text-brand-accentLight hover:underline ml-1 inline-flex items-center gap-0.5"
          >
            <span>Register instead</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

      </div>
    </AuthLayout>
  );
};

export default LoginPage;

