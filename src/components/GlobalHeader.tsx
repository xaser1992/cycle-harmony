// 🌸 Global Header Component - Settings & Notifications (Performance Optimized)
import { forwardRef, useState } from 'react';
import { Settings, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCycleData } from '@/hooks/useCycleData';
import { NotificationSettingsSheet } from '@/components/NotificationSettingsSheet';

export const GlobalHeader = forwardRef<HTMLDivElement, {}>(function GlobalHeader(props, ref) {
  const navigate = useNavigate();
  const { notificationPrefs } = useCycleData();
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);

  return (
    <>
      {/* Header Buttons - Not fixed, scrolls with page */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none safe-area-top">
        <div className="flex items-center justify-between px-4 pt-4">
          {/* Settings Button - Left */}
          <button
            onClick={() => navigate('/settings')}
            className="pointer-events-auto w-11 h-11 rounded-full bg-card/90 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center active:scale-90 transition-transform duration-150 group"
          >
            <div className="group-hover:rotate-90 transition-transform duration-300">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* Notification Button - Right - Opens Sheet */}
          <button
            onClick={() => setIsNotificationSheetOpen(true)}
            className={`pointer-events-auto w-11 h-11 rounded-full backdrop-blur-xl border shadow-lg flex items-center justify-center active:scale-90 transition-all duration-150 ${
              notificationPrefs.enabled 
                ? 'bg-gradient-to-br from-primary/90 to-primary border-primary/50' 
                : 'bg-card/90 border-border/50'
            }`}
          >
            {notificationPrefs.enabled ? (
              <Bell className="w-5 h-5 text-primary-foreground animate-fade-in" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground animate-fade-in" />
            )}
          </button>
        </div>
      </div>

      {/* Notification Settings Sheet */}
      <NotificationSettingsSheet 
        isOpen={isNotificationSheetOpen}
        onClose={() => setIsNotificationSheetOpen(false)}
      />
    </>
  );
});
