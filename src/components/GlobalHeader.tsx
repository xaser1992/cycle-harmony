// 🌸 Global Header Component - Settings & Notifications
import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/settings')}
            className="pointer-events-auto w-11 h-11 rounded-full bg-card/90 backdrop-blur-xl border border-border/50 shadow-lg flex items-center justify-center"
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </motion.button>

          {/* Notification Button - Right - Opens Sheet */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsNotificationSheetOpen(true)}
            className={`pointer-events-auto w-11 h-11 rounded-full backdrop-blur-xl border shadow-lg flex items-center justify-center transition-colors ${
              notificationPrefs.enabled 
                ? 'bg-primary border-primary/50' 
                : 'bg-card/90 border-border/50'
            }`}
          >
            <AnimatePresence mode="wait">
              {notificationPrefs.enabled ? (
                <motion.div
                  key="bell-on"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 30 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Bell className="w-5 h-5 text-primary-foreground" />
                </motion.div>
              ) : (
                <motion.div
                  key="bell-off"
                  initial={{ scale: 0, rotate: 30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -30 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
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
