// 🔔 Notification Settings Sheet Component - Simplified Single List
import { useState, useEffect, forwardRef } from 'react';
import {
  X, 
  Bell, 
  Pill
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useCycleData } from '@/hooks/useCycleData';
import { App } from '@capacitor/app';
import { toast } from 'sonner';
import { 
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

// All notification types in one list with categories
const allNotificationTypes: { 
  key: NotificationType; 
  label: { tr: string; en: string }; 
  description: { tr: string; en: string };
  category: 'cycle' | 'wellness';
}[] = [
  // Cycle notifications
  { key: 'period_approaching', label: { tr: 'Regl Yaklaşıyor', en: 'Period Approaching' }, description: { tr: '2 gün önce hatırlatma', en: 'Reminder 2 days before' }, category: 'cycle' },
  { key: 'period_expected', label: { tr: 'Regl Bugün', en: 'Period Today' }, description: { tr: 'Beklenen gün bildirimi', en: 'Expected day notification' }, category: 'cycle' },
  { key: 'period_late', label: { tr: 'Regl Gecikti', en: 'Period Late' }, description: { tr: 'Gecikme uyarısı', en: 'Late warning' }, category: 'cycle' },
  { key: 'fertile_start', label: { tr: 'Doğurgan Dönem', en: 'Fertile Window' }, description: { tr: 'Dönem başlangıcı', en: 'Window start' }, category: 'cycle' },
  { key: 'ovulation_day', label: { tr: 'Yumurtlama Günü', en: 'Ovulation Day' }, description: { tr: 'Tahmini yumurtlama', en: 'Estimated ovulation' }, category: 'cycle' },
  { key: 'fertile_ending', label: { tr: 'Dönem Bitiyor', en: 'Window Ending' }, description: { tr: 'Dönem sonu uyarısı', en: 'Window end warning' }, category: 'cycle' },
  { key: 'pms_reminder', label: { tr: 'PMS Hatırlatması', en: 'PMS Reminder' }, description: { tr: 'PMS dönemi bildirimi', en: 'PMS period notification' }, category: 'cycle' },
  { key: 'daily_checkin', label: { tr: 'Günlük Check-in', en: 'Daily Check-in' }, description: { tr: 'Durumunu kaydet', en: 'Log your status' }, category: 'cycle' },
  // Wellness notifications
  { key: 'water_reminder', label: { tr: 'Su İç', en: 'Drink Water' }, description: { tr: 'Günde 3 kez hatırlatma', en: '3 times a day reminder' }, category: 'wellness' },
  { key: 'exercise_reminder', label: { tr: 'Egzersiz', en: 'Exercise' }, description: { tr: 'Günlük hareket', en: 'Daily movement' }, category: 'wellness' },
];

// Animated icon component for each notification type
function NotificationIcon({ type, isEnabled }: { type: NotificationType; isEnabled: boolean }) {
  const baseClass = `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isEnabled ? 'scale-100' : 'scale-95 opacity-70'}`;
  
  switch (type) {
    case 'period_approaching':
    case 'period_expected':
    case 'period_late':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-rose to-pink`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-pulse' : ''}`} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" className="fill-white/90" />
            <path d="M12 8v8M8 12h8" stroke="hsl(var(--rose))" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" className="fill-rose/40" />
          </svg>
        </div>
      );
    case 'fertile_start':
    case 'fertile_ending':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-teal to-cyan`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} viewBox="0 0 24 24" fill="none">
            <path d="M12 21c-1.5-1.5-6-5-6-10a6 6 0 1 1 12 0c0 5-4.5 8.5-6 10z" fill="white" opacity="0.9" />
            <path d="M12 18c-1-1-4-3.5-4-7a4 4 0 1 1 8 0c0 3.5-3 6-4 7z" className="fill-teal/50" />
            <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.8" />
          </svg>
        </div>
      );
    case 'ovulation_day':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-violet to-purple`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
            <circle cx="12" cy="12" r="5" className="fill-violet/60" />
            <circle cx="10" cy="10" r="2" fill="white" opacity="0.8" />
          </svg>
        </div>
      );
    case 'pms_reminder':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-amber to-orange`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-pulse' : ''}`} viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" opacity="0.9" />
          </svg>
        </div>
      );
    case 'daily_checkin':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-emerald to-green`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-bounce' : ''}`} style={{ animationDuration: '1.5s' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" fill="white" opacity="0.9" />
            <path d="M9 12l2 2 4-4" stroke="hsl(var(--emerald))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'water_reminder':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-sky to-blue`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} viewBox="0 0 24 24" fill="none">
            <path d="M12 2c-4 6-7 9-7 13a7 7 0 1 0 14 0c0-4-3-7-7-13z" fill="white" opacity="0.9" />
            <path d="M12 6c-2.5 4-4.5 6-4.5 8.5a4.5 4.5 0 1 0 9 0c0-2.5-2-4.5-4.5-8.5z" className="fill-sky/50" />
          </svg>
        </div>
      );
    case 'exercise_reminder':
      return (
        <div className={`${baseClass} bg-gradient-to-br from-orange to-red`}>
          <svg className={`w-5 h-5 ${isEnabled ? 'animate-bounce' : ''}`} style={{ animationDuration: '1s' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="2.5" fill="white" opacity="0.9" />
            <path d="M12 8v5M9 10l3 3 3-3M8 18l4-5 4 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${baseClass} bg-gradient-to-br from-slate to-gray`}>
          <Bell className="w-5 h-5 text-white" />
        </div>
      );
  }
}

export const NotificationSettingsSheet = forwardRef<HTMLDivElement, NotificationSettingsSheetProps>(function NotificationSettingsSheet({ isOpen, onClose }, ref) {
  const { notificationPrefs, updateNotificationPrefs, userSettings } = useCycleData();
  const [medicationNotificationsEnabled, setMedicationNotificationsEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  
  const isEnglish = userSettings.language === 'en';

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
      toast.success(isEnglish ? 'Notification permission granted!' : 'Bildirim izni verildi!');
    } else {
      toast.error(isEnglish ? 'Notification permission denied' : 'Bildirim izni reddedildi');
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
      toast.success(isEnglish ? 'Medication reminders enabled' : 'İlaç hatırlatmaları açıldı');
    } else {
      await cancelMedicationNotifications();
      toast.success(isEnglish ? 'Medication reminders disabled' : 'İlaç hatırlatmaları kapatıldı');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-full">
      {/* Accessibility: Hidden title for screen readers */}
      <div className="sr-only">
        <h1>{isEnglish ? 'Notification Settings' : 'Bildirim Ayarları'}</h1>
        <p>{isEnglish ? 'Manage your notification preferences' : 'Bildirim tercihlerinizi yönetin'}</p>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet to-purple px-6 pt-6 pb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEnglish ? 'Notifications' : 'Bildirimler'}
              </h2>
              <p className="text-sm text-white/80">
                {hasPermission 
                  ? (isEnglish ? 'Permission granted ✓' : 'İzin verildi ✓')
                  : (isEnglish ? 'Permission required' : 'İzin gerekli')
                }
              </p>
            </div>
          </div>
        </div>

        {/* Master Toggle - Moved to top */}
        <div className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
          <span className="text-white font-medium">
            {isEnglish ? 'All Notifications' : 'Tüm Bildirimler'}
          </span>
          <div
            className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors ${
              notificationPrefs.enabled ? 'bg-white' : 'bg-white/30'
            }`}
            onClick={() => updateNotificationPrefs({ enabled: !notificationPrefs.enabled })}
          >
            <div
              className={`absolute top-1 w-6 h-6 rounded-full shadow-md transition-all ${
                notificationPrefs.enabled ? 'bg-violet-500 left-[calc(100%-28px)]' : 'bg-white left-1'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Content - Single scrollable list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 bg-background">
        {!hasPermission && (
          <div className="mb-4 p-4 bg-accent rounded-2xl">
            <p className="text-sm text-accent-foreground mb-3">
              {isEnglish 
                ? 'You need to grant permission to receive notifications.'
                : 'Bildirimleri almak için izin vermeniz gerekiyor.'
              }
            </p>
            <Button
              onClick={handleRequestPermissions}
              className="w-full bg-amber hover:bg-amber/90"
            >
              {isEnglish ? 'Grant Permission' : 'İzin Ver'}
            </Button>
          </div>
        )}

        {/* All Notifications List */}
        <div className="space-y-3">
          {/* Cycle Section Header */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose to-pink flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" className="fill-white/90" />
                <circle cx="12" cy="12" r="4" className="fill-rose/50" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {isEnglish ? 'Cycle Notifications' : 'Döngü Bildirimleri'}
            </span>
          </div>

          {allNotificationTypes.filter(t => t.category === 'cycle').map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-3">
                <NotificationIcon type={type.key} isEnabled={notificationPrefs.togglesByType[type.key] && notificationPrefs.enabled} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isEnglish ? type.label.en : type.label.tr}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEnglish ? type.description.en : type.description.tr}
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPrefs.togglesByType[type.key]}
                onCheckedChange={(checked) => handleNotificationToggle(type.key, checked)}
                disabled={!notificationPrefs.enabled}
              />
            </div>
          ))}

          {/* Wellness Section Header */}
          <div className="flex items-center gap-2 pt-4 pb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky to-blue flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 2c-4 6-7 9-7 13a7 7 0 1 0 14 0c0-4-3-7-7-13z" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {isEnglish ? 'Wellness Reminders' : 'Sağlık Hatırlatmaları'}
            </span>
          </div>

          {allNotificationTypes.filter(t => t.category === 'wellness').map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50"
            >
              <div className="flex items-center gap-3">
                <NotificationIcon type={type.key} isEnabled={notificationPrefs.togglesByType[type.key] && notificationPrefs.enabled} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isEnglish ? type.label.en : type.label.tr}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEnglish ? type.description.en : type.description.tr}
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPrefs.togglesByType[type.key]}
                onCheckedChange={(checked) => handleNotificationToggle(type.key, checked)}
                disabled={!notificationPrefs.enabled}
              />
            </div>
          ))}

          {/* Medication Section Header */}
          <div className="flex items-center gap-2 pt-4 pb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-purple flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {isEnglish ? 'Medication Reminders' : 'İlaç Hatırlatmaları'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet/10 to-purple/10 rounded-2xl border border-violet-light/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-purple flex items-center justify-center transition-all ${medicationNotificationsEnabled ? 'scale-100' : 'scale-95 opacity-70'}`}>
                <Pill className={`w-5 h-5 text-white ${medicationNotificationsEnabled ? 'animate-bounce' : ''}`} style={{ animationDuration: '2s' }} />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {isEnglish ? 'Medication Alerts' : 'İlaç Bildirimleri'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEnglish 
                    ? 'Auto-reminders for your medications'
                    : 'Eklediğiniz ilaçlar için otomatik bildirim'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={medicationNotificationsEnabled}
              onCheckedChange={handleMedicationNotificationsToggle}
              disabled={!notificationPrefs.enabled}
            />
          </div>

          <div className="p-4 bg-muted/50 rounded-xl mt-2">
            <p className="text-sm text-muted-foreground">
              💡 {isEnglish 
                ? 'You will receive reminders at the times you set for each medication. Use the "Medications" tab to add medications.'
                : 'Her ilaç için belirlediğiniz saatlerde hatırlatma alırsınız. İlaç eklemek için "İlaçlar" sekmesini kullanın.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
