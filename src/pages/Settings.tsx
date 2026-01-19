// 🌸 Settings Page
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  Shield, 
  Smartphone, 
  Moon, 
  Sun,
  ChevronRight,
  Download,
  Trash2,
  Bug,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useNavigate } from 'react-router-dom';
import type { NotificationType } from '@/types/cycle';

const notificationTypes: { key: NotificationType; label: string; emoji: string }[] = [
  { key: 'period_approaching', label: 'Regl Yaklaşıyor', emoji: '🌸' },
  { key: 'period_expected', label: 'Regl Bugün Bekleniyor', emoji: '📅' },
  { key: 'period_late', label: 'Regl Gecikti', emoji: '⏰' },
  { key: 'fertile_start', label: 'Doğurgan Dönem Başladı', emoji: '💐' },
  { key: 'ovulation_day', label: 'Yumurtlama Günü', emoji: '🥚' },
  { key: 'fertile_ending', label: 'Doğurgan Dönem Bitiyor', emoji: '🌙' },
  { key: 'pms_reminder', label: 'PMS Hatırlatması', emoji: '⚡' },
  { key: 'daily_checkin', label: 'Günlük Check-in', emoji: '✅' },
  { key: 'water_reminder', label: 'Su İç Hatırlatması', emoji: '💧' },
  { key: 'exercise_reminder', label: 'Egzersiz Hatırlatması', emoji: '🏃‍♀️' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { 
    cycleSettings, 
    notificationPrefs, 
    userSettings,
    updateCycleSettings,
    updateNotificationPrefs,
    updateUserSettings
  } = useCycleData();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleNotificationToggle = async (type: NotificationType, enabled: boolean) => {
    await updateNotificationPrefs({
      togglesByType: {
        ...notificationPrefs.togglesByType,
        [type]: enabled,
      }
    });
  };

  const handleExportData = async () => {
    // Export data as JSON
    const data = {
      cycleSettings,
      notificationPrefs,
      userSettings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dongutakibi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    if (confirm('Tüm verileriniz silinecek. Bu işlem geri alınamaz. Emin misiniz?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick,
    rightElement 
  }: {
    icon: typeof Bell;
    label: string;
    value?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        {value && <p className="text-sm text-muted-foreground">{value}</p>}
      </div>
      {rightElement || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
      </header>

      <main className="px-6 space-y-6">
        {/* Cycle Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Döngü Ayarları</h3>
          <Card className="overflow-hidden">
            <SettingRow
              icon={Calendar}
              label="Döngü Uzunluğu"
              value={`${cycleSettings.cycleLength} gün`}
              onClick={() => setActiveSection(activeSection === 'cycle' ? null : 'cycle')}
            />
            
            {activeSection === 'cycle' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-4"
              >
                <div className="flex items-center justify-between bg-muted rounded-xl p-3">
                  <span className="text-sm">Döngü Uzunluğu</span>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => updateCycleSettings({ cycleLength: Math.max(21, cycleSettings.cycleLength - 1) })}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{cycleSettings.cycleLength}</span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCycleSettings({ cycleLength: Math.min(40, cycleSettings.cycleLength + 1) })}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-muted rounded-xl p-3">
                  <span className="text-sm">Regl Süresi</span>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCycleSettings({ periodLength: Math.max(2, cycleSettings.periodLength - 1) })}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-bold">{cycleSettings.periodLength}</span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCycleSettings({ periodLength: Math.min(10, cycleSettings.periodLength + 1) })}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Bildirimler</h3>
          <Card className="overflow-hidden">
            <SettingRow
              icon={Bell}
              label="Bildirimler"
              value={notificationPrefs.enabled ? 'Açık' : 'Kapalı'}
              rightElement={
                <Switch 
                  checked={notificationPrefs.enabled}
                  onCheckedChange={(checked) => updateNotificationPrefs({ enabled: checked })}
                />
              }
            />
            
            {notificationPrefs.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-t border-border"
              >
                {notificationTypes.map((type) => (
                  <div 
                    key={type.key}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <span>{type.emoji}</span>
                      <span className="text-sm">{type.label}</span>
                    </div>
                    <Switch
                      checked={notificationPrefs.togglesByType[type.key]}
                      onCheckedChange={(checked) => handleNotificationToggle(type.key, checked)}
                    />
                  </div>
                ))}
                
                <div className="px-4 py-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Bildirim Saati</span>
                    <span className="text-sm font-medium">{notificationPrefs.preferredTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gizli Mod</span>
                    <span className="text-sm font-medium capitalize">{notificationPrefs.privacyMode}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Görünüm</h3>
          <Card className="overflow-hidden">
            <SettingRow
              icon={userSettings.theme === 'dark' ? Moon : Sun}
              label="Tema"
              value={userSettings.theme === 'dark' ? 'Koyu' : userSettings.theme === 'light' ? 'Açık' : 'Sistem'}
              onClick={() => {
                const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
                const currentIndex = themes.indexOf(userSettings.theme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                updateUserSettings({ theme: nextTheme });
              }}
            />
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Gizlilik & Veri</h3>
          <Card className="overflow-hidden">
            <SettingRow
              icon={Shield}
              label="Uygulama Kilidi"
              value={userSettings.appLockEnabled ? 'Açık' : 'Kapalı'}
              rightElement={
                <Switch 
                  checked={userSettings.appLockEnabled}
                  onCheckedChange={(checked) => updateUserSettings({ appLockEnabled: checked })}
                />
              }
            />
            <SettingRow
              icon={Download}
              label="Verileri Dışa Aktar"
              value="JSON formatında indir"
              onClick={handleExportData}
            />
            <SettingRow
              icon={Trash2}
              label="Tüm Verileri Sil"
              value="Bu işlem geri alınamaz"
              onClick={handleDeleteAllData}
            />
          </Card>
        </motion.div>

        {/* Debug */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Geliştirici</h3>
          <Card className="overflow-hidden">
            <SettingRow
              icon={Bug}
              label="Bildirim Tanılama"
              value="Debug paneli"
              onClick={() => navigate('/debug')}
            />
          </Card>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4 bg-muted/50 border-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🌸</span>
              <div>
                <p className="font-semibold">Döngü Takibi</p>
                <p className="text-xs text-muted-foreground">Versiyon 1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Bu uygulama tıbbi cihaz değildir. Sağlık kararlarınız için lütfen bir sağlık uzmanına danışın.
            </p>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
