// 🔔 Notification Settings Sheet Component
import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Clock, 
  VolumeX, 
  Eye,
  TestTube,
  Pill,
  Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TimePicker } from '@/components/TimePicker';
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
import type { NotificationType, PrivacyMode } from '@/types/cycle';

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

const privacyModes: { value: PrivacyMode; label: string; description: string; icon: string }[] = [
  { value: 'off', label: 'Tam', description: 'Detaylı bildirim içeriği', icon: '👁️' },
  { value: 'partial', label: 'Kısmi', description: 'Genel hatırlatma', icon: '👀' },
  { value: 'full', label: 'Gizli', description: 'Sadece başlık göster', icon: '🔒' },
];

export const NotificationSettingsSheet = forwardRef<HTMLDivElement, NotificationSettingsSheetProps>(function NotificationSettingsSheet({ isOpen, onClose }, ref) {
  const { notificationPrefs, updateNotificationPrefs, userSettings } = useCycleData();
  const [activeTab, setActiveTab] = useState<'cycle' | 'wellness' | 'medication' | 'settings'>('cycle');
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

  const tabs = [
    { id: 'cycle', label: 'Döngü', icon: '🌸' },
    { id: 'wellness', label: 'Wellness', icon: '💧' },
    { id: 'medication', label: 'İlaç', icon: '💊' },
    { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
  ] as const;

  return (
    <Sheet open={isOpen} onOpenChange={() => {}}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-[2rem] p-0 border-0"
        aria-describedby={undefined}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden.Root>
          <SheetTitle>Bildirim Ayarları</SheetTitle>
          <SheetDescription>Bildirim tercihlerinizi yönetin</SheetDescription>
        </VisuallyHidden.Root>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-400 to-purple-500 px-6 pt-6 pb-8">
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="relative">
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

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-foreground shadow-lg'
                      : 'bg-white/20 text-white/90 hover:bg-white/30'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-background">
            {!hasPermission && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl"
              >
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  Bildirimleri almak için izin vermeniz gerekiyor.
                </p>
                <Button
                  onClick={handleRequestPermissions}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                >
                  İzin Ver
                </Button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'cycle' && (
                <motion.div
                  key="cycle"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    Döngü bildirimleri ile önemli günleri kaçırmayın
                  </p>
                  {cycleNotificationTypes.map((type) => (
                    <div
                      key={type.key}
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
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'wellness' && (
                <motion.div
                  key="wellness"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    Günlük sağlık alışkanlıkları için hatırlatmalar
                  </p>
                  {wellnessNotificationTypes.map((type) => (
                    <div
                      key={type.key}
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
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'medication' && (
                <motion.div
                  key="medication"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    İlaçlarınız için zamanında hatırlatmalar alın
                  </p>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl border border-violet-200/30 dark:border-violet-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
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
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      💡 Her ilaç için belirlediğiniz saatlerde hatırlatma alırsınız. 
                      İlaç eklemek için "İlaçlar" sekmesini kullanın.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Time Settings */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Zamanlama</h3>
                    
                    <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-violet-500" />
                        <div>
                          <p className="text-sm font-medium">Bildirim Saati</p>
                          <p className="text-xs text-muted-foreground">Tercih edilen saat</p>
                        </div>
                      </div>
                      <TimePicker
                        value={notificationPrefs.preferredTime}
                        onChange={(time) => updateNotificationPrefs({ preferredTime: time })}
                        label=""
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                        <VolumeX className="w-5 h-5 text-violet-500" />
                        <div>
                          <p className="text-sm font-medium">Sessiz Saatler</p>
                          <p className="text-xs text-muted-foreground">Bu saatlerde bildirim gelmez</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <TimePicker
                          value={notificationPrefs.quietHoursStart}
                          onChange={(time) => updateNotificationPrefs({ quietHoursStart: time })}
                          label=""
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <TimePicker
                          value={notificationPrefs.quietHoursEnd}
                          onChange={(time) => updateNotificationPrefs({ quietHoursEnd: time })}
                          label=""
                        />
                      </div>
                    </div>
                  </div>

                  {/* Privacy Mode */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Gizlilik Modu
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {privacyModes.map((mode) => (
                        <motion.button
                          key={mode.value}
                          onClick={() => updateNotificationPrefs({ privacyMode: mode.value })}
                          className={`p-3 rounded-xl text-center transition-all ${
                            notificationPrefs.privacyMode === mode.value
                              ? 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-md'
                              : 'bg-card border border-border/50'
                          }`}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="text-lg block mb-1">{mode.icon}</span>
                          <p className="text-xs font-medium">{mode.label}</p>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {privacyModes.find(m => m.value === notificationPrefs.privacyMode)?.description}
                    </p>
                  </div>

                  {/* Test Notification */}
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
