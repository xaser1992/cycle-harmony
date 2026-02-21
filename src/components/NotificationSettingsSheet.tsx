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
import { useCycleData } from '@/contexts/CycleDataContext';
import { useBackHandler } from '@/hooks/useBackHandler';
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

type NotifItem = { key: NotificationType; label: { tr: string; en: string }; emoji: string; description: { tr: string; en: string } };

const cycleNotificationTypes: NotifItem[] = [
  { key: 'period_approaching', label: { tr: 'Regl Yaklaşıyor', en: 'Period Approaching' }, emoji: '🌸', description: { tr: '2 gün önce hatırlatma', en: 'Reminder 2 days before' } },
  { key: 'period_expected', label: { tr: 'Regl Bugün', en: 'Period Today' }, emoji: '📅', description: { tr: 'Beklenen gün bildirimi', en: 'Expected day notification' } },
  { key: 'period_late', label: { tr: 'Regl Gecikti', en: 'Period Late' }, emoji: '⏰', description: { tr: 'Gecikme uyarısı', en: 'Late period alert' } },
  { key: 'fertile_start', label: { tr: 'Doğurgan Dönem', en: 'Fertile Window' }, emoji: '💐', description: { tr: 'Dönem başlangıcı', en: 'Window start' } },
  { key: 'ovulation_day', label: { tr: 'Yumurtlama Günü', en: 'Ovulation Day' }, emoji: '🥚', description: { tr: 'Tahmini yumurtlama', en: 'Estimated ovulation' } },
  { key: 'fertile_ending', label: { tr: 'Dönem Bitiyor', en: 'Window Ending' }, emoji: '🌙', description: { tr: 'Dönem sonu uyarısı', en: 'Window end alert' } },
  { key: 'pms_reminder', label: { tr: 'PMS Hatırlatması', en: 'PMS Reminder' }, emoji: '⚡', description: { tr: 'PMS dönemi bildirimi', en: 'PMS phase notification' } },
  { key: 'daily_checkin', label: { tr: 'Günlük Check-in', en: 'Daily Check-in' }, emoji: '✅', description: { tr: 'Durumunu kaydet', en: 'Log your status' } },
];

const wellnessNotificationTypes: NotifItem[] = [
  { key: 'water_reminder', label: { tr: 'Su Hatırlatması', en: 'Water Reminder' }, emoji: '💧', description: { tr: 'Düzenli su içme bildirimi', en: 'Stay hydrated reminder' } },
  { key: 'exercise_reminder', label: { tr: 'Egzersiz Hatırlatması', en: 'Exercise Reminder' }, emoji: '🏃‍♀️', description: { tr: 'Hareket etme bildirimi', en: 'Stay active reminder' } },
];

export const NotificationSettingsSheet = forwardRef<HTMLDivElement, NotificationSettingsSheetProps>(function NotificationSettingsSheet({ isOpen, onClose }, ref) {
  const { notificationPrefs, updateNotificationPrefs, userSettings } = useCycleData();
  const [hasPermission, setHasPermission] = useState(false);

  // Check permissions on open and auto-request if needed
  useEffect(() => {
    if (isOpen) {
      checkNotificationPermissions().then(async (granted) => {
        setHasPermission(granted);
        // Auto-request permission if not granted
        if (!granted) {
          const newGranted = await requestNotificationPermissions();
          setHasPermission(newGranted);
          if (newGranted) {
            toast.success(userSettings.language === 'tr' ? 'Bildirim izni verildi!' : 'Notification permission granted!');
          }
        }
      });
    }
  }, [isOpen, userSettings.language]);

  // Handle Android back button
  useBackHandler(isOpen, onClose);

  const lang = userSettings.language;

  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    if (granted) {
      toast.success(lang === 'tr' ? 'Bildirim izni verildi!' : 'Notification permission granted!');
    } else {
      toast.error(lang === 'tr' ? 'Bildirim izni reddedildi' : 'Notification permission denied');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification(lang);
      toast.success(lang === 'tr' ? 'Test bildirimi gönderildi!' : 'Test notification sent!');
    } catch (error) {
      toast.error(lang === 'tr' ? 'Bildirim gönderilemedi' : 'Failed to send notification');
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
            {/* Header - Balanced */}
            <div className="relative bg-card border-b border-border px-5 pt-5 pb-4">
              {/* Header row with back button, centered icon/title, and status */}
              <div className="relative flex items-center justify-center">
                {/* Back button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  className="absolute left-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>

                {/* Centered icon and title */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose to-pink flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">{lang === 'tr' ? 'Bildirim Ayarları' : 'Notification Settings'}</h2>
                  </div>
                  {hasPermission ? (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald/20 text-emerald text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                      {lang === 'tr' ? 'Bildirimler aktif' : 'Notifications active'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-amber/20 text-amber text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                      {lang === 'tr' ? 'İzin gerekli' : 'Permission required'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 overflow-y-auto px-6 py-6 bg-background pb-24"
            >
              {/* Permission Warning - Detailed */}
              {!hasPermission && (
                <div className="mb-4 p-4 bg-amber/10 border border-amber/20 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <Bell className="w-5 h-5 text-amber mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {lang === 'tr' ? 'Bildirim izni gerekli' : 'Notification permission required'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {lang === 'tr'
                          ? 'Hatırlatmalar alabilmek için bildirim iznini etkinleştirin. İzin verdikten sonra bildirimler çalışmazsa, telefon ayarlarından "Uygulama etkinliğini duraklat" seçeneğini kapatın.'
                          : 'Enable notification permission to receive reminders. If notifications don\'t work after granting permission, disable "Pause app activity" in phone settings.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRequestPermissions}
                      size="sm"
                      className="h-9 px-4 text-sm bg-amber hover:bg-amber/90 text-white"
                    >
                      {lang === 'tr' ? 'İzin Ver' : 'Grant Permission'}
                    </Button>
                    <Button
                      onClick={() => toast.info(
                        lang === 'tr'
                          ? 'Ayarlar > Uygulamalar > Luna Joy > Bildirimler yolunu izleyin. "Uygulama etkinliğini duraklat" kapalı olmalı.'
                          : 'Go to Settings > Apps > Luna Joy > Notifications. "Pause app activity" should be off.',
                        { duration: 5000 }
                      )}
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 text-sm border-amber/30 text-amber"
                    >
                      {lang === 'tr' ? 'Ayarlar Yardımı' : 'Settings Help'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Cycle Notifications Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>🌸</span> {lang === 'tr' ? 'Döngü Bildirimleri' : 'Cycle Notifications'}
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
                          <p className="text-sm font-medium text-foreground">{type.label[lang]}</p>
                          <p className="text-xs text-muted-foreground">{type.description[lang]}</p>
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

              {/* Wellness Notifications Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span>🧘</span> {lang === 'tr' ? 'Sağlık Hatırlatıcıları' : 'Wellness Reminders'}
                </h3>
                <div className="space-y-2">
                  {wellnessNotificationTypes.map((type, index) => (
                    <motion.div
                      key={type.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + index * 0.03 }}
                      className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{type.label[lang]}</p>
                          <p className="text-xs text-muted-foreground">{type.description[lang]}</p>
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
                  {lang === 'tr' ? 'Test Bildirimi Gönder' : 'Send Test Notification'}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
