// 🔔 Notification Settings Sheet Component - Full Screen
import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  TestTube,
  Pill,
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
import { 
  scheduleMedicationNotifications,
  cancelMedicationNotifications
} from '@/lib/medicationNotifications';
import { getMedications } from '@/lib/medicationStorage';
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

const wellnessNotificationTypes: { key: NotificationType; label: string; emoji: string; description: string }[] = [
  { key: 'water_reminder', label: 'Su İç', emoji: '💧', description: 'Günde 3 kez hatırlatma' },
  { key: 'exercise_reminder', label: 'Egzersiz', emoji: '🏃‍♀️', description: 'Günlük hareket' },
];

export const NotificationSettingsSheet = forwardRef<HTMLDivElement, NotificationSettingsSheetProps>(function NotificationSettingsSheet({ isOpen, onClose }, ref) {
  const { notificationPrefs, updateNotificationPrefs, userSettings } = useCycleData();
  const [medicationNotificationsEnabled, setMedicationNotificationsEnabled] = useState(true);
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

  const handleMedicationNotificationsToggle = async (enabled: boolean) => {
    setMedicationNotificationsEnabled(enabled);
    if (enabled) {
      const medications = await getMedications();
      await scheduleMedicationNotifications(medications.filter(m => m.isActive));
      toast.success('İlaç hatırlatmaları açıldı');
    } else {
      await cancelMedicationNotifications();
      toast.success('İlaç hatırlatmaları kapatıldı');
    }
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
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative overflow-hidden bg-gradient-to-r from-violet to-purple px-6 pt-6 pb-8"
            >
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Back button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 active:scale-90 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div className="relative pt-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Bildirim Ayarları</h2>
                    <p className="text-sm text-white/80">
                      {hasPermission ? 'İzin verildi ✓' : 'İzin gerekli'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between mt-4 p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <span className="text-white font-medium">Tüm Bildirimler</span>
                <motion.div
                  className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors ${
                    notificationPrefs.enabled ? 'bg-white' : 'bg-white/30'
                  }`}
                  onClick={() => updateNotificationPrefs({ enabled: !notificationPrefs.enabled })}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className={`absolute top-1 w-6 h-6 rounded-full shadow-md ${
                      notificationPrefs.enabled ? 'bg-violet-500' : 'bg-white'
                    }`}
                    animate={{ left: notificationPrefs.enabled ? 'calc(100% - 28px)' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Content - All sections merged */}
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
                  className="mb-6 p-4 bg-amber/20 border border-amber/30 rounded-2xl"
                >
                  <p className="text-sm text-foreground mb-3">
                    Bildirimleri almak için izin vermeniz gerekiyor.
                  </p>
                  <Button
                    onClick={handleRequestPermissions}
                    className="w-full bg-amber hover:bg-amber/90 text-white"
                  >
                    İzin Ver
                  </Button>
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
                          <p className="text-sm font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.togglesByType[type.key]}
                        onCheckedChange={(checked) => handleNotificationToggle(type.key, checked)}
                        disabled={!notificationPrefs.enabled}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Wellness Notifications Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>💧</span> Wellness Bildirimleri
                </h3>
                <div className="space-y-2">
                  {wellnessNotificationTypes.map((type, index) => (
                    <motion.div
                      key={type.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.24 + index * 0.03 }}
                      className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notificationPrefs.togglesByType[type.key]}
                        onCheckedChange={(checked) => handleNotificationToggle(type.key, checked)}
                        disabled={!notificationPrefs.enabled}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Medication Notifications Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>💊</span> İlaç Bildirimleri
                </h3>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-violet/10 to-purple/10 rounded-2xl border border-violet-light/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-purple flex items-center justify-center">
                      <Pill className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">İlaç Hatırlatmaları</p>
                      <p className="text-xs text-muted-foreground">
                        Eklediğiniz ilaçlar için otomatik bildirim
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={medicationNotificationsEnabled}
                    onCheckedChange={handleMedicationNotificationsToggle}
                    disabled={!notificationPrefs.enabled}
                  />
                </motion.div>
              </div>

              {/* Test Button */}

              {/* Test Notification Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  className="w-full"
                  disabled={!hasPermission || !notificationPrefs.enabled}
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
