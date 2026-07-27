import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, LogIn, ArrowRight, User, Car, ShieldCheck } from 'lucide-react';
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

const REMEMBERED_MOBILE_KEY = 'ridemate_remembered_mobile';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('passenger');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      mobileNumber: '',
      password: '',
      rememberMe: false,
    }
  });

  // On mount: check for remembered mobile number and populate form
  useEffect(() => {
    const rememberedMobile = localStorage.getItem(REMEMBERED_MOBILE_KEY);
    if (rememberedMobile) {
      setValue('mobileNumber', rememberedMobile, { shouldValidate: true });
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await login(values.mobileNumber, values.password, role);
      if (res.success) {
        // Save or clear remembered mobile number ONLY upon successful login
        if (values.rememberMe) {
          localStorage.setItem(REMEMBERED_MOBILE_KEY, values.mobileNumber);
        } else {
          localStorage.removeItem(REMEMBERED_MOBILE_KEY);
        }

        navigate(role === 'driver' ? ROUTES.DRIVER_DASHBOARD : ROUTES.PASSENGER_DASHBOARD, { replace: true });
      } else {
        setErrorMsg(res.errorMsg || 'Invalid mobile number or password. Please verify your credentials and try again.');
      }
    } catch {
      setErrorMsg('Authentication error. Unable to connect to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const rememberedMobile = localStorage.getItem(REMEMBERED_MOBILE_KEY);
    if (rememberedMobile) {
      reset({
        mobileNumber: rememberedMobile,
        password: '',
        rememberMe: true,
      });
    } else {
      reset({
        mobileNumber: '',
        password: '',
        rememberMe: false,
      });
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Password recovery is coming soon in Sprint 3.');
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to coordinate your Karachi daily commute."
    >
      <div className="space-y-5">
        
        {/* Floating Portal Selection Tabs Segment */}
        <div className="p-1.5 rounded-2xl bg-white/90 border border-slate-200/90 flex gap-2 select-none shadow-md shadow-slate-200/50 mb-6 backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleRoleChange('passenger')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]",
              role === 'passenger'
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 border border-emerald-600"
                : "bg-slate-100/90 hover:bg-slate-200/70 text-slate-600 border border-slate-200/80"
            )}
          >
            <User className={cn("w-4 h-4 shrink-0", role === 'passenger' ? "text-white" : "text-slate-400")} />
            <span>Passenger<span className="hidden sm:inline"> Portal</span></span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('driver')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]",
              role === 'driver'
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/25 border border-sky-600"
                : "bg-slate-100/90 hover:bg-slate-200/70 text-slate-600 border border-slate-200/80"
            )}
          >
            <Car className={cn("w-4 h-4 shrink-0", role === 'driver' ? "text-white" : "text-slate-400")} />
            <span>Driver<span className="hidden sm:inline"> Portal</span></span>
          </button>
        </div>

        {/* Global form errors */}
        <ValidationMessage message={errorMsg || undefined} variant="error" />

        {/* Refined Auth Card */}
        <AuthCard>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
            
            {/* Mobile input */}
            <Input
              label="Mobile Number"
              placeholder="e.g. 03001234567"
              inputFilter="mobile"
              leftIcon={<Phone className="h-4.5 w-4.5 text-slate-400" />}
              error={errors.mobileNumber?.message}
              disabled={isSubmitting}
              {...register('mobileNumber')}
            />

            {/* Password input */}
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
            />

            {/* Form actions row */}
            <div className="flex items-center justify-between text-xs py-1 select-none">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer hover:text-slate-800 transition-colors">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 transition-all"
                  disabled={isSubmitting}
                  {...register('rememberMe')}
                />
                <span>Remember Me</span>
              </label>
              
              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant={role === 'driver' ? 'secondary' : 'primary'}
              className="w-full mt-3 py-3 min-h-[48px] shadow-md shadow-emerald-500/10 font-bold"
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<LogIn className="h-4.5 w-4.5" />}
            >
              Sign In to {role === 'driver' ? 'Driver Portal' : 'Passenger Portal'}
            </Button>
          </form>
        </AuthCard>

        {/* Security / Corporate Trust Badge Pill */}
        <div className="flex justify-center pt-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-500 text-xs font-semibold shadow-2xs backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Karachi Coworker Auth</span>
          </div>
        </div>

        {/* Register navigation link */}
        <div className="text-center text-xs text-slate-500 select-none pt-1">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate(ROUTES.SELECT_ROLE)}
            className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline ml-1 inline-flex items-center gap-1 transition-colors cursor-pointer"
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

