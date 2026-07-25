import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Phone, 
  Building, 
  Star, 
  Edit2,
  X,
  Camera,
  Heart,
  Calendar
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { usePassenger } from '../../hooks/usePassenger';
import { useToast } from '../../contexts/ToastContext';
import { z } from 'zod';

const editProfileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  mobileNumber: z.string().min(1, 'Phone number is required'),
  officeName: z.string().optional(),
  emergencyName: z.string().min(3, 'Emergency contact name is required'),
  emergencyPhone: z.string().min(10, 'Emergency contact phone is required'),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export const PassengerProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { rideHistory } = usePassenger();
  const { addToast } = useToast();
  
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    mode: 'onChange',
  });

  // Prefill form values
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.name,
        mobileNumber: user.mobileNumber,
        officeName: user.officeName || '',
        emergencyName: localStorage.getItem('ridemate_emergency_name') || '',
        emergencyPhone: localStorage.getItem('ridemate_emergency_phone') || '',
      });
    }
  }, [user, reset, showEditModal]);

  const handleEditSubmit = async (values: EditProfileFormValues) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      updateUser({ name: values.fullName, mobileNumber: values.mobileNumber, officeName: values.officeName });
      localStorage.setItem('ridemate_emergency_name', values.emergencyName);
      localStorage.setItem('ridemate_emergency_phone', values.emergencyPhone);
      
      setShowEditModal(false);
      addToast('success', 'Profile Updated', 'Your passenger details have been successfully updated.');
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error(err);
      addToast('error', 'Error', 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUploadMock = () => {
    addToast('success', 'Photo Uploaded', 'Your profile photo placeholder has been updated successfully.');
  };

  const completedCount = rideHistory.filter(r=>r.status==='Completed').length;

  const completionStats = [
    !!user?.name,
    !!user?.mobileNumber,
    !!user?.officeName,
    !!localStorage.getItem('ridemate_emergency_name'),
  ];
  const completionPercentage = Math.round((completionStats.filter(Boolean).length / completionStats.length) * 100);

  return (
    <div className="space-y-8 text-left select-none relative max-w-4xl">
      <PageHeader 
        title="Passenger Profile" 
        description="Verify trust scores, carbon credits, and contact details."
        actions={
          <Button 
            variant="glass" 
            size="sm" 
            leftIcon={<Edit2 className="h-4 w-4" />}
            onClick={() => setShowEditModal(true)}
          >
            Edit Profile
          </Button>
        }
      />

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card Summary */}
        <div className="md:col-span-1 space-y-6">
          <Card hoverEffect={false} className="border border-brand-border/40 p-6 flex flex-col items-center text-center space-y-4 md:col-span-1 bg-brand-card/30">
            <div className="relative group cursor-pointer" onClick={handlePhotoUploadMock}>
              <Avatar name={user?.name || 'Abdul Waseo'} size="lg" className="scale-110" />
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-brand-text leading-snug">{user?.name}</h3>
              <div className="flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>4.7 Commuter Score</span>
              </div>
              <Badge variant="primary" className="text-[10px] mt-1 inline-block">Verified Passenger</Badge>
            </div>

            <div className="w-full h-px bg-brand-border/40 my-2" />

            <div className="grid grid-cols-2 gap-4 w-full text-xs pt-1">
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block">Trips Served</span>
                <strong className="text-brand-text font-semibold">{completedCount} Rides</strong>
              </div>
              <div className="text-center">
                <span className="text-[9px] uppercase font-bold text-brand-muted tracking-wider block">Member Since</span>
                <strong className="text-brand-text font-semibold uppercase">Mar 2026</strong>
              </div>
            </div>
          </Card>

          {/* Completion Indicator */}
          <Card hoverEffect={false} className="border border-brand-border/40 p-5 bg-brand-card/20 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-brand-text">Profile Completion</span>
              <span className="text-brand-primaryLight">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-brand-border/40 overflow-hidden">
              <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
            </div>
            <p className="text-[10px] text-brand-muted">Complete emergency contacts to reach 100% completion.</p>
          </Card>
        </div>

        {/* Detailed Verification specifications */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Work Details */}
          <Card hoverEffect={false} className="border border-brand-border/40 p-6 space-y-4 bg-brand-card/30">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-2 flex items-center gap-2">
              <User className="h-4.5 w-4.5" />
              <span>Personal & Work Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-brand-muted block uppercase text-[9px] tracking-wide mb-0.5">Mobile Number</span>
                <span className="text-brand-text font-semibold">{user?.mobileNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-brand-muted block uppercase text-[9px] tracking-wide mb-0.5">Office / Company</span>
                <span className="text-brand-text font-semibold">{user?.officeName || 'Dilkusha Towers'}</span>
              </div>
              <div>
                <span className="text-brand-muted block uppercase text-[9px] tracking-wide mb-0.5">Corporate Email</span>
                <span className="text-brand-text font-semibold">{user?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-brand-muted block uppercase text-[9px] tracking-wide mb-0.5">CNIC Number</span>
                <span className="text-brand-text font-semibold">{user?.cnicNumber || 'N/A'}</span>
              </div>
            </div>
          </Card>

          {/* Emergency Safety Details */}
          <Card hoverEffect={false} className="border border-brand-border/40 p-6 space-y-4 bg-brand-card/30">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-2 flex items-center gap-2">
              <Heart className="h-4.5 w-4.5" />
              <span>Emergency Contacts (Safety Verification)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-brand-muted block uppercase text-[9px] tracking-wide mb-0.5">Contact Name</span>
                <span className="text-brand-text font-semibold">
                  {localStorage.getItem('ridemate_emergency_name') || 'Not Set'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block uppercase text-[9px] tracking-wide mb-0.5">Contact Phone</span>
                <span className="text-brand-text font-semibold">
                  {localStorage.getItem('ridemate_emergency_phone') || 'Not Set'}
                </span>
              </div>
            </div>
          </Card>

          {/* Recent Activity List */}
          <Card hoverEffect={false} className="border border-brand-border/40 p-6 space-y-4 bg-brand-card/30">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border/40 pb-2">
              Recent Activity Feed
            </h4>
            <div className="space-y-3.5">
              {rideHistory.length > 0 ? (
                rideHistory.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-xs text-left items-start">
                    <div className="p-1.5 rounded-lg border border-brand-border/40 bg-white/[0.01]">
                      <Calendar className="h-4 w-4 text-brand-primaryLight" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-text">
                        Trip with {entry.driverName} ({entry.status})
                      </p>
                      <p className="text-[9px] text-brand-muted">{entry.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-brand-muted italic">No recent booking activity recorded.</p>
              )}
            </div>
          </Card>

        </div>

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          
          <div className="relative w-full max-w-md z-10">
            <Card hoverEffect={false} className="border border-brand-border bg-brand-card shadow-glass p-6 sm:p-8 rounded-2xl">
              
              {/* Close Icon */}
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/[0.02] border border-brand-border text-brand-textMuted hover:text-brand-text"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-5 text-left">
                <h3 className="text-lg font-bold text-brand-text">Edit Passenger Profile</h3>
                <p className="text-xs text-brand-textMuted mt-1">
                  Update your contact details and safety contacts.
                </p>
              </div>

              <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4 text-left">
                
                <Input
                  label="Full Name"
                  leftIcon={<User className="h-4 w-4 text-brand-muted" />}
                  error={errors.fullName?.message}
                  disabled={isSubmitting}
                  {...register('fullName')}
                />

                <Input
                  label="Mobile Number"
                  leftIcon={<Phone className="h-4 w-4 text-brand-muted" />}
                  error={errors.mobileNumber?.message}
                  disabled={isSubmitting}
                  {...register('mobileNumber')}
                />

                <Input
                  label="Office Location"
                  leftIcon={<Building className="h-4 w-4 text-brand-muted" />}
                  error={errors.officeName?.message}
                  disabled={isSubmitting}
                  {...register('officeName')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Emergency Name"
                    leftIcon={<User className="h-4 w-4 text-brand-muted" />}
                    error={errors.emergencyName?.message}
                    disabled={isSubmitting}
                    {...register('emergencyName')}
                  />
                  <Input
                    label="Emergency Phone"
                    leftIcon={<Phone className="h-4 w-4 text-brand-muted" />}
                    error={errors.emergencyPhone?.message}
                    disabled={isSubmitting}
                    {...register('emergencyPhone')}
                  />
                </div>

                <div className="pt-4 flex gap-3 justify-end border-t border-brand-border/40">
                  <Button variant="glass" size="sm" type="button" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                    Save Profile
                  </Button>
                </div>

              </form>

            </Card>
          </div>
        </div>
      )}

    </div>
  );
};

export default PassengerProfile;
