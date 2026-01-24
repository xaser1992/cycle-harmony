// 🔔 Notification Settings Sheet Component - Full Screen
import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  TestTube,
  ChevronLeft
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useCycleData } from '@/hooks/useCycleData';
import { App } from '@capacitor/app';
import { toast } from 'sonner';
import { 
  sendTestNotification, 
  requestNotificationPermissions,
  checkNotificationPermissions 
} from '@/lib/notifications';
import type { NotificationType } from '@/types/cycle';

interface NotificationSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const cycleNotificationTypes: { key: NotificationType; label: string; emoji: string; description: string }[] = [
  { key: 'period_approaching', label: 'Regl Yaklaşıyor', emoji: '🌸', description: '2 gün önce hatırlatma' },
  { key: 'period_expected', label: 'Regl Bugün', emoji: '📅', description: 'Beklenen gün bildirimi' },
  { key: 'period_late', label: 'Regl Gecikti', emoji: '⏰', description: 'Gecikme uyarısı' },
  { key: 'fertile_start', label: 'Doğurgan Dönem', emoji: '💐', description: 'Dönem başlangıcı' },
  { key: 'ovulation_day', label: 'Yumurtlama Günü', emoji: '🥚', description: 'Tahmini yumurtlama' },
  { key: 'fertile_ending', label: 'Dönem Bitiyor', emoji: '🌙', description: 'Dönem sonu uyarısı' },
  { key: 'pms_reminder', label: 'PMS Hatırlatması', emoji: '⚡', description: 'PMS dönemi bildirimi' },
  { key: 'daily_checkin', label: 'Günlük Check-in', emoji: '✅', description: 'Durumunu kaydet' },
];

export const NotificationSettingsSheet = forwardRef<HTMLDivElement, NotificationSettingsSheetProps>(function NotificationSettingsSheet({ isOpen, onClose }, ref) {
  const { notificationPrefs, updateNotificationPrefs, userSettings } = useCycleData();
  const [hasPermission, setHasPermission] = useState(false);

  // Check permissions on open
  useEffect(() => {
    if (isOpen) {
      checkNotificationPermissions().then(setHasPermission);
    }
  }, [isOpen]);

  // Handle Android back button
  useEffect(() => {
    if (!isOpen) return;
    
    const backHandler = App.addListener('backButton', () => {
      onClose();
    });
    
    return () => {
      backHandler.then(handler => handler.remove());
    };
  }, [isOpen, onClose]);

  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    if (granted) {
      toast.success('Bildirim izni verildi!');
    } else {
      toast.error('Bildirim izni reddedildi');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification(userSettings.language);
      toast.success('Test bildirimi gönderildi!');
    } catch (error) {
      toast.error('Bildirim gönderilemedi');
    }
  };

  const handleNotificationToggle = async (type: NotificationType, enabled: boolean) => {
    await updateNotificationPrefs({
      togglesByType: {
        ...notificationPrefs.togglesByType,
        [type]: enabled,
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          <div className="flex flex-col h-full safe-area-top">
            {/* Header - Theme Compatible */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative overflow-hidden bg-card border-b border-border px-6 pt-6 pb-6"
            >
              {/* Decorative gradient orbs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-rose/20 to-pink/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet/15 to-purple/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
              
              {/* Back button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center z-50 active:scale-90 transition-transform border border-border/50"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>

              <div className="relative pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose to-pink flex items-center justify-center shadow-lg">
                    <Bell className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Bildirim Ayarları</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {hasPermission ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                          İzin verildi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber/20 text-amber text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                          İzin gerekli
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 overflow-y-auto px-6 py-6 bg-background pb-24"
            >
              {/* Permission Warning */}
              {!hasPermission && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gradient-to-r from-amber/10 to-orange/10 border border-amber/30 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber/20 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-amber" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Bildirim İzni Gerekli
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Hatırlatmaları almak için bildirim iznini aktifleştirin.
                      </p>
                      <Button
                        onClick={handleRequestPermissions}
                        size="sm"
                        className="bg-gradient-to-r from-amber to-orange hover:opacity-90 text-white shadow-md"
                      >
                        İzin Ver
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Cycle Notifications Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>🌸</span> Döngü Bildirimleri
                </h3>
                <div className="space-y-2">
                  {cycleNotificationTypes.map((type, index) => (
                    <motion.div
                      key={type.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.togglesByType[type.key]}
                        onCheckedChange={(checked) => handleNotificationToggle(type.key, checked)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Test Notification Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  className="w-full"
                  disabled={!hasPermission}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Bildirimi Gönder
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
