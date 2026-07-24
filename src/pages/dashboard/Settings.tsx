import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Shield, 
  Bell, 
  Lock, 
  Trash2, 
  Globe
} from 'lucide-react';
import { cn } from '../../utils/cn';

type SettingsTab = 'Appearance' | 'Security' | 'Privacy' | 'Notifications';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const { logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('Appearance');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Security Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Privacy toggles
  const [shareStats, setShareStats] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  // Notification toggles
  const [notifSound, setNotifSound] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('error', 'Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'Error', 'Confirm password does not match new password.');
      return;
    }

    setIsChangingPass(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsChangingPass(false);
    
    addToast('success', 'Security Updated', 'Your account password has been changed successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    addToast('warning', 'Account Deletion Request', 'Your commuter account is being purged from RideMate servers.');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logout();
  };

  const confirmLogoutAll = async () => {
    setShowLogoutModal(false);
    addToast('success', 'Logged Out', 'Successfully terminated all other active sessions.');
  };

  return (
    <div className="space-y-8 text-left max-w-4xl select-none">
      
      {/* Page Header */}
      <PageHeader 
        title="Settings Workspace" 
        description="Configure your visual themes, notification alerts, privacy parameters, or commuter security corridors."
      />

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar (Left) */}
        <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r border-brand-border/40 pb-3 md:pb-0 md:pr-4">
          {(['Appearance', 'Security', 'Privacy', 'Notifications'] as SettingsTab[]).map((tab) => {
            const iconMap = {
              Appearance: <Sun className="h-4 w-4" />,
              Security: <Lock className="h-4 w-4" />,
              Privacy: <Shield className="h-4 w-4" />,
              Notifications: <Bell className="h-4 w-4" />,
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap w-full",
                  activeTab === tab 
                    ? "bg-brand-primary text-brand-bg shadow-sm"
                    : "text-brand-textMuted hover:text-brand-text hover:bg-white/[0.01]"
                )}
              >
                {iconMap[tab]}
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Detail Workspace (Right) */}
        <div className="flex-1 min-w-0">
          
          {/* Appearance tab */}
          {activeTab === 'Appearance' && (
            <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/25 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-brand-text mb-1">Visual Appearance</h3>
                <p className="text-xs text-brand-textMuted">Choose how RideMate dashboard elements should render on your display.</p>
              </div>

              {/* Theme selectors grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light Mode', icon: <Sun className="h-4.5 w-4.5 text-amber-500" /> },
                  { id: 'dark', label: 'Dark Mode', icon: <Moon className="h-4.5 w-4.5 text-brand-primaryLight" /> },
                  { id: 'system', label: 'System Mode', icon: <Monitor className="h-4.5 w-4.5 text-blue-400" /> },
                ].map((t) => {
                  const active = theme === t.id;
                  
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        "p-4 rounded-2xl border bg-brand-card/10 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all hover:bg-white/[0.01]",
                        active ? "border-brand-primary bg-brand-primary/5 text-brand-primaryLight" : "border-brand-border/60 text-brand-textMuted"
                      )}
                    >
                      {t.icon}
                      <span className="text-xs font-bold">{t.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Language Selection */}
              <div className="pt-4 border-t border-brand-border/40 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
                  <Globe className="h-4 w-4" />
                  <span>Commuter Language Preference</span>
                </div>
                <select 
                  defaultValue="en"
                  onChange={() => addToast('info', 'Language Updated', 'Preferred language updated successfully.')}
                  className="w-full sm:w-64 bg-white/[0.01] border border-brand-border focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-text transition-all leading-normal"
                >
                  <option value="en">English (US)</option>
                  <option value="ur">Urdu (اردو)</option>
                </select>
              </div>
            </Card>
          )}

          {/* Security tab */}
          {activeTab === 'Security' && (
            <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/25 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-brand-text mb-1">Account Credentials</h3>
                <p className="text-xs text-brand-textMuted">Modify passwords, terminate active sessions, or request account deletions.</p>
              </div>

              {/* Password update form */}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Current Password</label>
                    <input 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white/[0.01] border border-brand-border focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-text transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">New Password</label>
                    <input 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/[0.01] border border-brand-border focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-text transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Confirm New Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/[0.01] border border-brand-border focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-xs text-brand-text transition-all"
                  />
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit"
                    variant="primary"
                    isLoading={isChangingPass}
                    disabled={isChangingPass}
                    className="bg-brand-primary text-brand-bg font-bold hover:bg-brand-primaryLight"
                  >
                    Change Password
                  </Button>
                </div>
              </form>

              {/* Other session logout */}
              <div className="pt-6 border-t border-brand-border/40 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-brand-text mb-1">Session Controls</h4>
                  <p className="text-[11px] text-brand-textMuted">Logout from all other mobile phones or browsers holding active credentials.</p>
                </div>
                <Button 
                  variant="glass"
                  size="sm"
                  onClick={() => setShowLogoutModal(true)}
                >
                  Logout from All Devices
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-red-500/20 space-y-4">
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-left">
                  <h4 className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    <span>Danger Zone</span>
                  </h4>
                  <p className="text-[11px] text-brand-textMuted mb-3">Permanently delete your profile information, ride publishing catalogs, and histories.</p>
                  <Button 
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteAccount}
                    className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                  >
                    Request Account Deletion
                  </Button>
                </div>
              </div>

            </Card>
          )}

          {/* Privacy tab */}
          {activeTab === 'Privacy' && (
            <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/25 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-brand-text mb-1">Privacy Preferences</h3>
                <p className="text-xs text-brand-textMuted">Determine who can see your contact links or ride matching statistics.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={shareStats}
                    onChange={(e) => {
                      setShareStats(e.target.checked);
                      addToast('success', 'Privacy Updated', 'Statistics sharing updated.');
                    }}
                    className="mt-1 accent-brand-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-text">Share commute statistics</p>
                    <p className="text-[10px] text-brand-textMuted">Allow show metric graphs of carbon and cash savings under your coworker card.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => {
                      setShowPhone(e.target.checked);
                      addToast('success', 'Privacy Updated', 'Contact visibility updated.');
                    }}
                    className="mt-1 accent-brand-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-text">Share phone number in chat</p>
                    <p className="text-[10px] text-brand-textMuted">Display Pakistani prefix mobile numbers inside active chatroom sidebars for coworkers contact corridor.</p>
                  </div>
                </label>
              </div>
            </Card>
          )}

          {/* Notifications tab */}
          {activeTab === 'Notifications' && (
            <Card hoverEffect={false} className="border border-brand-border/40 bg-brand-card/25 p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-brand-text mb-1">Notification Channels</h3>
                <p className="text-xs text-brand-textMuted">Configure sound, email alerts, or browser notification bells.</p>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={notifSound}
                    onChange={(e) => {
                      setNotifSound(e.target.checked);
                      addToast('success', 'Settings Saved', 'Audio alerts preference updated.');
                    }}
                    className="mt-1 accent-brand-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-text">Request alerts sound</p>
                    <p className="text-[10px] text-brand-textMuted">Play a subtle check chime when driver accepts or coworker messages.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => {
                      setEmailAlerts(e.target.checked);
                      addToast('success', 'Settings Saved', 'Email reports preference updated.');
                    }}
                    className="mt-1 accent-brand-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-brand-text">Email summaries</p>
                    <p className="text-[10px] text-brand-textMuted">Receive daily carbon saving progress emails sent to your office address.</p>
                  </div>
                </label>
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Delete Modal */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Commuter Account?"
        message="This is a permanent operation! Your coworker credentials, active bookings, history logs, and profile details will be cleared from RideMate. There is no recovery."
        confirmText="Permanently Delete"
        cancelText="Keep Account"
        variant="danger"
      />

      {/* Session logout modal */}
      <Dialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogoutAll}
        title="Logout from All Other Devices?"
        message="Are you sure you want to terminate other active browser session grids?"
        confirmText="Confirm Terminate"
        variant="warning"
      />

    </div>
  );
};
export default Settings;
