// 🌸 Settings Page - Flo Inspired Design
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Shield, 
  Moon, 
  Sun,
  Monitor,
  ChevronRight,
  Download,
  Trash2,
  Bug,
  Minus,
  Plus,
  ArrowLeft,
  Bell,
  Droplets,
  Scale,
  RotateCcw,
  type LucideIcon
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useTheme } from '@/components/ThemeProvider';
import { useAppLock } from '@/components/AppLockProvider';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { useNavigate } from 'react-router-dom';
import { checkNotificationPermissions, requestNotificationPermissions } from '@/lib/notifications';
import { Preferences } from '@capacitor/preferences';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { openUpdateSheet } = useUpdateSheet();
  const { theme, setTheme } = useTheme();
  const { isEnabled: isLockEnabled, hasPin, enableLock, disableLock, removePin } = useAppLock();
  const { 
    cycleSettings, 
    updateCycleSettings,
    userSettings,
    updateUserSettings,
  } = useCycleData();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [notificationGranted, setNotificationGranted] = useState<boolean | null>(null);
  const [isRequestingNotification, setIsRequestingNotification] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    checkNotificationPermissions().then(setNotificationGranted);
  }, []);

  const handleRequestNotification = async () => {
    setIsRequestingNotification(true);
    try {
      const granted = await requestNotificationPermissions();
      setNotificationGranted(granted);
    } catch (error) {
      console.error('Notification permission error:', error);
    } finally {
      setIsRequestingNotification(false);
    }
  };

  const handleCenterPress = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  const handleExportData = async () => {
    const data = {
      cycleSettings,
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
      await removePin();
      window.location.reload();
    }
  };

  const handleLockToggle = (checked: boolean) => {
    if (checked) {
      enableLock();
    } else {
      disableLock();
    }
  };

  const themes: { value: 'light' | 'dark' | 'system'; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Açık' },
    { value: 'dark', icon: Moon, label: 'Koyu' },
    { value: 'system', icon: Monitor, label: 'Sistem' },
  ];

  // Section Card Component
  const SectionCard = ({ 
    title, 
    icon: Icon, 
    gradient, 
    children,
    id,
    collapsible = false,
    rightElement
  }: {
    title: string;
    icon: LucideIcon;
    gradient: string;
    children: React.ReactNode;
    id?: string;
    collapsible?: boolean;
    rightElement?: React.ReactNode;
  }) => {
    const isExpanded = expandedSection === id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50"
      >
        <button
          onClick={() => collapsible && id && setExpandedSection(isExpanded ? null : id)}
          className="w-full flex items-center gap-4 p-4"
        >
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">{title}</p>
          </div>
          {rightElement}
          {collapsible && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          )}
        </button>
        
        <AnimatePresence>
          {(!collapsible || isExpanded) && (
            <motion.div
              initial={collapsible ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Setting Row Component
  const SettingRow = ({ 
    icon: Icon, 
    label, 
    description,
    onClick,
    rightElement,
    gradient = 'from-gray-400 to-gray-500'
  }: {
    icon: LucideIcon;
    label: string;
    description?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    gradient?: string;
  }) => (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </motion.button>
  );

  // Animated Toggle Component
  const AnimatedSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <motion.div
      className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors ${
        checked ? 'bg-gradient-to-r from-rose to-pink' : 'bg-muted'
      }`}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
        animate={{ left: checked ? 'calc(100% - 28px)' : '4px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header with Back Button */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <motion.button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
            <p className="text-sm text-muted-foreground">Uygulama tercihlerini özelleştir</p>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Cycle Settings */}
        <SectionCard
          title="Döngü Ayarları"
          icon={Calendar}
          gradient="from-rose to-pink"
          id="cycle"
          collapsible
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div>
                <p className="text-sm font-medium">Döngü Uzunluğu</p>
                <p className="text-xs text-muted-foreground">{cycleSettings.cycleLength} gün</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateCycleSettings({ cycleLength: Math.max(21, cycleSettings.cycleLength - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <span className="w-8 text-center font-bold text-lg">{cycleSettings.cycleLength}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateCycleSettings({ cycleLength: Math.min(40, cycleSettings.cycleLength + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div>
                <p className="text-sm font-medium">Regl Süresi</p>
                <p className="text-xs text-muted-foreground">{cycleSettings.periodLength} gün</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateCycleSettings({ periodLength: Math.max(2, cycleSettings.periodLength - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <span className="w-8 text-center font-bold text-lg">{cycleSettings.periodLength}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateCycleSettings({ periodLength: Math.min(10, cycleSettings.periodLength + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Wellness Goals */}
        <SectionCard
          title="Wellness Hedefleri"
          icon={Scale}
          gradient="from-emerald to-teal"
          id="wellness"
          collapsible
        >
          <div className="space-y-3">
            {/* Target Weight */}
            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-emerald" />
                <div>
                  <p className="text-sm font-medium">Hedef Ağırlık</p>
                  <p className="text-xs text-muted-foreground">{userSettings?.targetWeight || 60} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateUserSettings({ targetWeight: Math.max(30, (userSettings?.targetWeight || 60) - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <span className="w-10 text-center font-bold text-lg">{userSettings?.targetWeight || 60}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateUserSettings({ targetWeight: Math.min(150, (userSettings?.targetWeight || 60) + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            
            {/* Daily Water Goal */}
            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-blue" />
                <div>
                  <p className="text-sm font-medium">Günlük Su Hedefi</p>
                  <p className="text-xs text-muted-foreground">
                    {userSettings?.dailyWaterGoal || 9} bardak (~{((userSettings?.dailyWaterGoal || 9) * 0.25).toFixed(2)}L)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateUserSettings({ dailyWaterGoal: Math.max(4, (userSettings?.dailyWaterGoal || 9) - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <span className="w-8 text-center font-bold text-lg">{userSettings?.dailyWaterGoal || 9}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateUserSettings({ dailyWaterGoal: Math.min(20, (userSettings?.dailyWaterGoal || 9) + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Water Reminder Toggle */}
            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue" />
                <div>
                  <p className="text-sm font-medium">Su Hatırlatıcısı</p>
                  <p className="text-xs text-muted-foreground">Günde 3 kez hatırlat</p>
                </div>
              </div>
              <AnimatedSwitch 
                checked={notificationGranted === true}
                onChange={() => {
                  if (notificationGranted !== true) {
                    handleRequestNotification();
                  }
                }}
              />
            </div>
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard
          title="Görünüm"
          icon={themes.find(t => t.value === theme)?.icon || Sun}
          gradient="from-amber to-orange"
        >
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <motion.button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  theme === t.value
                    ? 'bg-gradient-to-br from-amber to-orange text-white shadow-lg'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <t.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{t.label}</span>
              </motion.button>
            ))}
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard
          title="Bildirimler"
          icon={Bell}
          gradient="from-violet to-purple"
        >
          <div className="space-y-3">
            {notificationGranted === false && (
              <motion.button
                onClick={handleRequestNotification}
                disabled={isRequestingNotification}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-amber-light dark:bg-amber/20 border border-amber/30 dark:border-amber/40"
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber to-orange flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-amber dark:text-amber-light">Bildirimlere İzin Ver</p>
                  <p className="text-xs text-amber/80 dark:text-amber-light/80">Hatırlatmalar için izin gerekli</p>
                </div>
                {isRequestingNotification ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full"
                  />
                ) : (
                  <ChevronRight className="w-5 h-5 text-amber" />
                )}
              </motion.button>
            )}
            
            {notificationGranted === true && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-light dark:bg-green/20">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green to-emerald flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green dark:text-green-light">Bildirimler Açık</p>
                  <p className="text-xs text-green/80 dark:text-green-light/80">Hatırlatmalar aktif</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Privacy & Data */}
        <SectionCard
          title="Gizlilik & Veri"
          icon={Shield}
          gradient="from-cyan to-teal"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-cyan" />
                <div>
                  <p className="text-sm font-medium">Uygulama Kilidi</p>
                  <p className="text-xs text-muted-foreground">
                    {hasPin ? 'PIN ile korunuyor' : 'Kapalı'}
                  </p>
                </div>
              </div>
              <AnimatedSwitch 
                checked={isLockEnabled}
                onChange={handleLockToggle}
              />
            </div>
            
            <SettingRow
              icon={Download}
              label="Verileri Dışa Aktar"
              description="JSON formatında indir"
              onClick={handleExportData}
              gradient="from-emerald to-green"
            />
            
            <SettingRow
              icon={Trash2}
              label="Tüm Verileri Sil"
              description="Bu işlem geri alınamaz"
              onClick={handleDeleteAllData}
              gradient="from-red to-rose"
            />
          </div>
        </SectionCard>

        {/* Developer */}
        <SectionCard
          title="Geliştirici"
          icon={Bug}
          gradient="from-slate to-slate"
        >
          <div className="space-y-3">
            <SettingRow
              icon={RotateCcw}
              label="Uygulama Turunu Göster"
              description="Özellikleri tekrar keşfet"
              onClick={async () => {
                await Preferences.remove({ key: 'app_tour_completed' });
                toast.success(userSettings?.language === 'tr' ? 'Tur sıfırlandı! Ana sayfaya gidin.' : 'Tour reset! Go to home page.');
              }}
              gradient="from-violet to-purple"
            />
            <SettingRow
              icon={Bug}
              label="Bildirim Tanılama"
              description="Debug paneli"
              onClick={() => navigate('/debug')}
              gradient="from-slate to-slate"
            />
          </div>
        </SectionCard>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-rose-light to-pink-light dark:from-rose/20 dark:to-pink/20 rounded-3xl p-5 border border-rose/30 dark:border-rose/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose to-pink flex items-center justify-center shadow-lg">
              <span className="text-2xl">🌸</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Döngü Takibi</p>
              <p className="text-xs text-muted-foreground">Versiyon 1.0.0</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            Bu uygulama tıbbi bir cihaz değildir. Sağlık kararlarınız için lütfen bir sağlık uzmanına danışın.
          </p>
        </motion.div>
      </main>

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
