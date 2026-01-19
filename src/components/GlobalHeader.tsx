// 🌸 Global Header Component - Settings & Notifications
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCycleData } from '@/hooks/useCycleData';

export function GlobalHeader() {
  const navigate = useNavigate();
  const { notificationPrefs, updateNotificationPrefs } = useCycleData();
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  const handleNotificationToggle = async () => {
    const newEnabled = !notificationPrefs.enabled;
    await updateNotificationPrefs({ enabled: newEnabled });
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 2000);
  };

  return (
    <>
      {/* Fixed Header Buttons */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none safe-area-top">
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

          {/* Notification Button - Right */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleNotificationToggle}
            className={`pointer-events-auto w-11 h-11 rounded-full backdrop-blur-xl border shadow-lg flex items-center justify-center transition-colors ${
              notificationPrefs.enabled 
                ? 'bg-gradient-to-br from-violet-400 to-purple-500 border-violet-400/50' 
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
                  <Bell className="w-5 h-5 text-white" />
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

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl"
          >
            <div className="flex items-center gap-2">
              {notificationPrefs.enabled ? (
                <>
                  <Bell className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium text-foreground">Bildirimler açık</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Bildirimler kapalı</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
