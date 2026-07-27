import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  ShieldCheck, 
  Car, 
  Compass, 
  CheckCircle, 
  ArrowRight,
  Palette,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthCard } from '../../components/auth/AuthCard';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { ValidationMessage } from '../../components/auth/ValidationMessage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { driverRegisterSchema } from '../../utils/validation';
import type { DriverRegisterFormValues } from '../../utils/validation';
import { ROUTES } from '../../constants/routes';

export const DriverRegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [hasPartialFailure, setHasPartialFailure] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<DriverRegisterFormValues>({
    resolver: zodResolver(driverRegisterSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      mobileNumber: '',
      email: '',
      cnicNumber: '',
      licenseNumber: '',
      vehicleType: 'Car',
      vehicleManufacturer: '',
      vehicleModel: '',
      vehicleColor: '',
      vehicleRegistrationNumber: '',
      officeName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const passwordValue = watch('password');
  const vehicleTypeVal = watch('vehicleType');

  const onSubmit = async (values: DriverRegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setHasPartialFailure(false);
    try {
      const res = await registerAuth({
        name: values.fullName,
        dateOfBirth: values.dateOfBirth,
        mobileNumber: values.mobileNumber,
        email: values.email || undefined,
        officeName: values.officeName || undefined,
        password: values.password,
        cnicNumber: values.cnicNumber,
        licenseNumber: values.licenseNumber,
        vehicleType: values.vehicleType,
        vehicleManufacturer: values.vehicleManufacturer,
        vehicleModel: values.vehicleModel,
        vehicleColor: values.vehicleColor,
        vehicleRegistrationNumber: values.vehicleRegistrationNumber,
        role: 'driver',
      });

      if (res.success) {
        if (res.driverProfileFailed) {
          setHasPartialFailure(true);
        }
        setIsRegistered(true);
      } else {
        setErrorMsg(res.errorMsg || 'Registration failed. Please check details and try again.');
      }
    } catch {
      setErrorMsg('Registration failed. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <AuthLayout title="Registration Sent" subtitle="You have successfully registered as a Driver.">
        <AuthCard className="text-center p-8 space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10 }}
            className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent"
          >
            <CheckCircle className="h-10 w-10" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-brand-text">Validation Underway</h3>
            <p className="text-sm text-brand-textMuted leading-relaxed max-w-sm mx-auto">
              Our admins are verifying your CNIC, license number, and vehicle plates. You can now access your overview.
            </p>
          </div>

          {hasPartialFailure && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs flex items-start gap-2.5 text-left">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
              <span>
                Your account was created, but your driver profile or vehicle details could not be saved automatically. Please complete your driver details in Dashboard &gt; Settings.
              </span>
            </div>
          )}

          <Badge variant="accent">Driver Verification Active</Badge>

          <div className="pt-2">
            <Button
              onClick={() => navigate(ROUTES.DRIVER_DASHBOARD, { replace: true })}
              variant="secondary"
              className="w-full"
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Go to Driver Dashboard
            </Button>
          </div>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Driver Registration"
      subtitle="Publish empty seats in your car or bike, verify work details, and offset fuel bills."
    >
      <div className="space-y-5">
        <ValidationMessage message={errorMsg || undefined} variant="error" />

        <AuthCard className="max-w-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* 1. Personal Info */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 text-left">
                Personal Identification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Syed Abdul Waseo"
                  leftIcon={<User className="h-4.5 w-4.5" />}
                  error={errors.fullName?.message}
                  disabled={isSubmitting}
                  inputFilter="name"
                  {...register('fullName')}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  leftIcon={<Calendar className="h-4.5 w-4.5" />}
                  error={errors.dateOfBirth?.message}
                  disabled={isSubmitting}
                  {...register('dateOfBirth')}
                />
                
                <Input
                  label="Mobile Number"
                  placeholder="e.g. 03001234567"
                  leftIcon={<Phone className="h-4.5 w-4.5" />}
                  error={errors.mobileNumber?.message}
                  disabled={isSubmitting}
                  inputFilter="mobile"
                  {...register('mobileNumber')}
                />
              </div>

              <Input
                label="Official Email (Optional)"
                placeholder="commuter@office.com"
                type="email"
                leftIcon={<Mail className="h-4.5 w-4.5" />}
                error={errors.email?.message}
                disabled={isSubmitting}
                {...register('email')}
              />

              <Input
                label="Office Name (Optional)"
                placeholder="e.g. Dilkusha Towers Level 4"
                leftIcon={<Building className="h-4.5 w-4.5" />}
                error={errors.officeName?.message}
                disabled={isSubmitting}
                {...register('officeName')}
              />
            </div>

            {/* 2. Verification Info */}
            <div className="space-y-3.5 pt-4">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 text-left">
                Driver Verification details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CNIC Number"
                  placeholder="e.g. 42101-1234567-1"
                  leftIcon={<FileText className="h-4.5 w-4.5" />}
                  error={errors.cnicNumber?.message}
                  disabled={isSubmitting}
                  inputFilter="cnic"
                  {...register('cnicNumber')}
                />
                
                <Input
                  label="License Number"
                  placeholder="e.g. KC-123456"
                  leftIcon={<ShieldCheck className="h-4.5 w-4.5" />}
                  error={errors.licenseNumber?.message}
                  disabled={isSubmitting}
                  {...register('licenseNumber')}
                />
              </div>
            </div>

            {/* 3. Vehicle Info */}
            <div className="space-y-3.5 pt-4">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 text-left">
                Vehicle Information
              </h4>

              {/* Segmented Selector for Vehicle Type */}
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-semibold tracking-wide text-brand-textMuted uppercase">Vehicle Type</span>
                <div className="p-1 rounded-xl bg-brand-surface border border-brand-border flex select-none w-full sm:max-w-xs">
                  <button
                    type="button"
                    onClick={() => {}}
                    {...register('vehicleType', { value: 'Car' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                      vehicleTypeVal === 'Car'
                        ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primaryLight"
                        : "text-brand-textMuted hover:text-brand-text border-transparent"
                    }`}
                  >
                    Car
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    {...register('vehicleType', { value: 'Bike' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                      vehicleTypeVal === 'Bike'
                        ? "bg-brand-accent/10 border-brand-accent/20 text-brand-accentLight"
                        : "text-brand-textMuted hover:text-brand-text border-transparent"
                    }`}
                  >
                    Bike
                  </button>
                </div>
                {errors.vehicleType?.message && (
                  <span className="text-xs text-red-400 mt-1">{errors.vehicleType.message}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Make / Manufacturer"
                  placeholder="e.g. Toyota, Honda, Suzuki"
                  leftIcon={<Car className="h-4.5 w-4.5" />}
                  error={errors.vehicleManufacturer?.message}
                  disabled={isSubmitting}
                  {...register('vehicleManufacturer')}
                />

                <Input
                  label="Vehicle Model"
                  placeholder="e.g. Corolla 2021"
                  leftIcon={<Car className="h-4.5 w-4.5" />}
                  error={errors.vehicleModel?.message}
                  disabled={isSubmitting}
                  {...register('vehicleModel')}
                />

                <Input
                  label="Vehicle Color"
                  placeholder="e.g. White, Silver, Black"
                  leftIcon={<Palette className="h-4.5 w-4.5" />}
                  error={errors.vehicleColor?.message}
                  disabled={isSubmitting}
                  {...register('vehicleColor')}
                />
                
                <Input
                  label="Vehicle Plate Number"
                  placeholder="e.g. BEY-789"
                  leftIcon={<Compass className="h-4.5 w-4.5" />}
                  error={errors.vehicleRegistrationNumber?.message}
                  disabled={isSubmitting}
                  {...register('vehicleRegistrationNumber')}
                />
              </div>
            </div>

            {/* 4. Credentials Info */}
            <div className="space-y-3.5 pt-4">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-1.5 text-left">
                Security Password
              </h4>

              <PasswordInput
                label="Password"
                placeholder="Create a strong password"
                showStrength={true}
                error={errors.password?.message}
                disabled={isSubmitting}
                {...register('password')}
                value={passwordValue}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your security password"
                error={errors.confirmPassword?.message}
                disabled={isSubmitting}
                {...register('confirmPassword')}
              />
            </div>

            {/* Accept Terms */}
            <div className="flex flex-col gap-1.5 pt-2 select-none">
              <label className="flex items-start gap-2.5 text-xs text-brand-textMuted font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-brand-border bg-brand-surface text-brand-primary focus:ring-brand-primary h-4.5 w-4.5 mt-0.5"
                  disabled={isSubmitting}
                  {...register('acceptTerms')}
                />
                <span className="leading-relaxed text-left">
                  I accept the RideMate{' '}
                  <a href="#" className="text-brand-accent hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and certify my vehicle registration and CNIC details are fully accurate.
                </span>
              </label>
              {errors.acceptTerms?.message && (
                <span className="text-xs text-red-400 mt-1">{errors.acceptTerms.message}</span>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="secondary"
              className="w-full mt-2 min-h-[48px] font-bold"
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
            >
              Register Driver Account
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

export default DriverRegisterPage;
