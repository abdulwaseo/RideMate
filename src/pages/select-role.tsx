import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Users, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthCard } from '../components/auth/AuthCard';
import { RoleCard } from '../components/auth/RoleCard';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants/routes';

export const SelectRolePage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'driver' | 'passenger' | null>(null);
  const navigate = useNavigate();

  const handleProceed = () => {
    if (selectedRole === 'driver') {
      navigate(ROUTES.REGISTER_DRIVER);
    } else if (selectedRole === 'passenger') {
      navigate(ROUTES.REGISTER_PASSENGER);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Select how you plan to commute with RideMate today. You can always edit this later."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoleCard
            icon={Car}
            title="Driver"
            description="I drive my own vehicle and want to offer empty seats to coworkers commuting on my path."
            isSelected={selectedRole === 'driver'}
            onClick={() => setSelectedRole('driver')}
          />
          <RoleCard
            icon={Users}
            title="Passenger"
            description="I commute to Dilkusha Towers and want to find verified drivers heading my way."
            isSelected={selectedRole === 'passenger'}
            onClick={() => setSelectedRole('passenger')}
          />
        </div>

        <AuthCard className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-xs text-brand-textMuted font-medium">Already have an account?</p>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="text-sm font-semibold text-brand-accent hover:text-brand-accentLight hover:underline transition-colors mt-0.5"
            >
              Sign in to your account
            </button>
          </div>

          <Button
            variant="primary"
            disabled={!selectedRole}
            onClick={handleProceed}
            rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </AuthCard>
      </div>
    </AuthLayout>
  );
};

export default SelectRolePage;
