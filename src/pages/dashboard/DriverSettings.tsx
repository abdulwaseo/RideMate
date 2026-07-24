import React from 'react';
import { 
  ShieldAlert, 
  LogOut,
  Sliders
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export const DriverSettings: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="space-y-8 text-left select-none max-w-3xl">
      <PageHeader 
        title="Settings" 
        description="Configure your corporate commute workspace preferences and notifications triggers."
      />

      <div className="space-y-6">
        
        {/* Profile Settings Segment */}
        <Card hoverEffect={false} className="border border-brand-border/40 p-6 space-y-4 bg-brand-card/25">
          <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider pb-2 border-b border-brand-border/30 flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5" />
            <span>Preferences Configuration</span>
          </h4>

          <div className="space-y-4 text-xs text-brand-textMuted">
            <div className="flex justify-between items-center py-1 border-b border-brand-border/20 pb-3">
              <div>
                <p className="font-bold text-brand-text">Theme Preference</p>
                <p className="text-[10px] text-brand-muted mt-0.5">Toggle light mode or premium dark mode overrides.</p>
              </div>
              <Badge variant="primary">Dark Theme Active</Badge>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-brand-border/20 pb-3">
              <div>
                <p className="font-bold text-brand-text">Commuter Languages</p>
                <p className="text-[10px] text-brand-muted mt-0.5">Primary language for transit updates.</p>
              </div>
              <span className="text-brand-text font-semibold">English (PK)</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <div>
                <p className="font-bold text-brand-text">Location Visibility</p>
                <p className="text-[10px] text-brand-muted mt-0.5">Hide precise meeting landmarks from non-accepted bookings.</p>
              </div>
              <Badge variant="muted">Enabled</Badge>
            </div>
          </div>
        </Card>

        {/* Action Panel */}
        <Card hoverEffect={false} className="border border-brand-border/40 p-6 space-y-4 bg-brand-card/25">
          <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider pb-2 border-b border-brand-border/30 flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5" />
            <span>Security Operations</span>
          </h4>

          <div className="flex justify-between items-center">
            <div className="text-xs">
              <p className="font-bold text-brand-text">Sign Out of Demo Portal</p>
              <p className="text-[10px] text-brand-muted mt-0.5">Resets session cache and returns to landing.</p>
            </div>
            
            <Button
              variant="danger"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={handleLogout}
              className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
            >
              Log Out
            </Button>
          </div>
        </Card>
        
        <p className="text-[10px] text-brand-muted text-center italic">
          Additional account configurations (OTP binding, license uploads) will release in Sprint 4.
        </p>
      </div>

    </div>
  );
};

export default DriverSettings;
