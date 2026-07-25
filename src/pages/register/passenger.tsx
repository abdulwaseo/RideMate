import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, Building, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthCard } from '../../components/auth/AuthCard';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { ValidationMessage } from '../../components/auth/ValidationMessage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { passengerRegisterSchema } from '../../utils/validation';
import type { PassengerRegisterFormValues } from '../../utils/validation';
import { ROUTES } from '../../constants/routes';

export const PassengerRegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<PassengerRegisterFormValues>({
    resolver: zodResolver(passengerRegisterSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      mobileNumber: '',
      email: '',
      officeName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    }
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: PassengerRegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await registerAuth({
        name: values.fullName,
        mobileNumber: values.mobileNumber,
        email: values.email || undefined,
        officeName: values.officeName || undefined,
        role: 'passenger',
      });
      // Show success screen
      setIsRegistered(true);
    } catch (err) {
      setErrorMsg('Registration failed. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <AuthLayout title="Account Created" subtitle="You have successfully registered with RideMate.">
        <AuthCard className="text-center p-8 space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10 }}
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary"
          >
            <CheckCircle className="h-10 w-10" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-brand-text">Verification Pending</h3>
            <p className="text-sm text-brand-textMuted leading-relaxed max-w-sm mx-auto">
              Your commuter account is created. Access the dashboard to publish schedules or search corporate rides.
            </p>
          </div>

          <Badge variant="success">Passenger Account Active</Badge>

          <div className="pt-2">
            <Button
              onClick={() => navigate(ROUTES.PASSENGER_DASHBOARD, { replace: true })}
              variant="primary"
              className="w-full"
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Go to Dashboard
            </Button>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Passenger Signup"
      subtitle="Verify your status to match with corporate drivers heading to Dilkusha Towers."
    >
      <div className="space-y-5">
        <ValidationMessage message={errorMsg || undefined} variant="error" />

        <AuthCard>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="e.g. Abdul Waseo"
              leftIcon={<User className="h-4.5 w-4.5" />}
              error={errors.fullName?.message}
              disabled={isSubmitting}
              {...register('fullName')}
            />

            {/* Mobile Number */}
            <Input
              label="Mobile Number"
              placeholder="e.g. 03001234567"
              leftIcon={<Phone className="h-4.5 w-4.5" />}
              error={errors.mobileNumber?.message}
              disabled={isSubmitting}
              {...register('mobileNumber')}
            />

            {/* Email (Optional) */}
            <Input
              label="Work Email (Optional)"
              type="email"
              placeholder="e.g. name@company.com"
              leftIcon={<Mail className="h-4.5 w-4.5" />}
              error={errors.email?.message}
              disabled={isSubmitting}
              {...register('email')}
            />

            {/* Office Name (Optional) */}
            <Input
              label="Office Name (Optional)"
              placeholder="e.g. Dilkusha Towers Level 4"
              leftIcon={<Building className="h-4.5 w-4.5" />}
              error={errors.officeName?.message}
              disabled={isSubmitting}
              {...register('officeName')}
            />

            {/* Password */}
            <PasswordInput
              label="Password"
              placeholder="Create a strong password"
              showStrength={true}
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
              value={passwordValue}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your security password"
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
              {...register('confirmPassword')}
            />

            {/* Accept Terms */}
            <div className="flex flex-col gap-1.5 pt-2 select-none">
              <label className="flex items-start gap-2.5 text-xs text-brand-textMuted font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary h-4.5 w-4.5 mt-0.5"
                  disabled={isSubmitting}
                  {...register('acceptTerms')}
                />
                <span className="leading-relaxed">
                  I accept the RideMate{' '}
                  <a href="#" className="text-brand-accent hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and verify I commute to PECHS corridor.
                </span>
              </label>
              {errors.acceptTerms?.message && (
                <span className="text-xs text-red-400 mt-1">{errors.acceptTerms.message}</span>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
            >
              Register Account
            </Button>
          </form>
        </AuthCard>

        {/* Back navigation */}
        <div className="text-center text-xs text-brand-muted select-none pt-1">
          Already have an account?{' '}
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="font-bold text-brand-accent hover:text-brand-accentLight hover:underline ml-1 inline-flex items-center gap-0.5"
          >
            <span>Log in instead</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default PassengerRegisterPage;
