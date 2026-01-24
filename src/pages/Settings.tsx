// 🌸 Settings Page - Flo Inspired Design (Zero Motion for Native Performance)
import { useState, useRef } from 'react';
import { 
  Calendar, 
  Shield, 
  Moon, 
  Sun,
  Monitor,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  Bug,
  Minus,
  Plus,
  ArrowLeft,
  Droplets,
  Scale,
  RotateCcw,
  Archive,
  X,
  type LucideIcon
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useTheme } from '@/components/ThemeProvider';
import { useAppLock } from '@/components/AppLockProvider';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { exportData, importData } from '@/lib/storage';

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
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCenterPress = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  const handleBackupData = async () => {
    try {
      const jsonData = await exportData();
      const zip = new JSZip();
      zip.file('dongutakibi-backup.json', jsonData);
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dongutakibi-yedek-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Yedek başarıyla indirildi!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Yedekleme başarısız oldu');
    }
  };

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file('dongutakibi-backup.json');
      
      if (!jsonFile) {
        toast.error('Geçersiz yedek dosyası');
        return;
      }

      const jsonData = await jsonFile.async('string');
      const success = await importData(jsonData);
      
      if (success) {
        toast.success('Veriler başarıyla geri yüklendi!');
        window.location.reload();
      } else {
        toast.error('Geri yükleme başarısız oldu');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Geçersiz dosya formatı');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  // Section Card Component (Zero Motion)
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
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50 animate-fade-in">
        <button
          onClick={() => collapsible && id && setExpandedSection(isExpanded ? null : id)}
          className="w-full flex items-center gap-3 p-3 active:bg-muted/50 transition-colors"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">{title}</p>
          </div>
          {rightElement}
          {collapsible && (
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </button>
        
        {(!collapsible || isExpanded) && (
          <div className="px-3 pb-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Setting Row Component (Zero Motion)
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
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all"
    >
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />)}
    </button>
  );

  // Toggle Component (Zero Motion - CSS only)
  const AnimatedSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div
      className={`relative w-14 h-8 rounded-full cursor-pointer transition-colors duration-200 active:scale-95 ${
        checked ? 'bg-gradient-to-r from-rose to-pink' : 'bg-muted'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div
        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${
          checked ? 'left-[calc(100%-28px)]' : 'left-1'
        }`}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header with Back Button */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-background rounded-xl">
              <div>
                <p className="text-sm font-medium">Döngü Uzunluğu</p>
                <p className="text-xs text-muted-foreground">{cycleSettings.cycleLength} gün</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCycleSettings({ cycleLength: Math.max(21, cycleSettings.cycleLength - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-lg">{cycleSettings.cycleLength}</span>
                <button
                  onClick={() => updateCycleSettings({ cycleLength: Math.min(40, cycleSettings.cycleLength + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2.5 bg-background rounded-xl">
              <div>
                <p className="text-sm font-medium">Regl Süresi</p>
                <p className="text-xs text-muted-foreground">{cycleSettings.periodLength} gün</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateCycleSettings({ periodLength: Math.max(2, cycleSettings.periodLength - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-lg">{cycleSettings.periodLength}</span>
                <button
                  onClick={() => updateCycleSettings({ periodLength: Math.min(10, cycleSettings.periodLength + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
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
          <div className="space-y-2">
            {/* Target Weight */}
            <div className="flex items-center justify-between p-2.5 bg-background rounded-xl">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-emerald" />
                <div>
                  <p className="text-sm font-medium">Hedef Ağırlık</p>
                  <p className="text-xs text-muted-foreground">{userSettings?.targetWeight || 60} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateUserSettings({ targetWeight: Math.max(30, (userSettings?.targetWeight || 60) - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-lg">{userSettings?.targetWeight || 60}</span>
                <button
                  onClick={() => updateUserSettings({ targetWeight: Math.min(150, (userSettings?.targetWeight || 60) + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Daily Water Goal */}
            <div className="flex items-center justify-between p-2.5 bg-background rounded-xl">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-blue" />
                <div>
                  <p className="text-sm font-medium">Günlük Su Hedefi</p>
                  <p className="text-xs text-muted-foreground">
                    {userSettings?.dailyWaterGoal || 9} bardak (~{((userSettings?.dailyWaterGoal || 9) * 0.25).toFixed(2)}L)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateUserSettings({ dailyWaterGoal: Math.max(4, (userSettings?.dailyWaterGoal || 9) - 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-lg">{userSettings?.dailyWaterGoal || 9}</span>
                <button
                  onClick={() => updateUserSettings({ dailyWaterGoal: Math.min(20, (userSettings?.dailyWaterGoal || 9) + 1) })}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
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
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-[0.97] ${
                  theme === t.value
                    ? 'bg-gradient-to-br from-amber to-orange text-white shadow-lg'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <t.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
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
            
            {/* Hidden file input for restore */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleRestoreData}
              className="hidden"
            />
            
            {/* Backup & Restore Button */}
            <button
              onClick={() => setBackupModalOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald to-green flex items-center justify-center">
                <Archive className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Veri Yedekleme</p>
                <p className="text-xs text-muted-foreground">Yedekle veya geri yükle</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            
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
        <div className="bg-gradient-to-br from-rose-light to-pink-light dark:from-rose/20 dark:to-pink/20 rounded-3xl p-5 border border-rose/30 dark:border-rose/30 animate-fade-in">
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
        </div>

        {/* Backup Modal (Zero Motion) */}
        {backupModalOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
              onClick={() => setBackupModalOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl border border-border pointer-events-auto animate-scale-in"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald to-green flex items-center justify-center">
                      <Archive className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Veri Yedekleme</h3>
                      <p className="text-xs text-muted-foreground">ZIP formatında</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBackupModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleBackupData();
                      setBackupModalOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-emerald to-green text-white rounded-xl active:scale-[0.98] transition-transform"
                  >
                    <Download className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Yedekle</p>
                      <p className="text-xs opacity-80">Verilerini ZIP olarak indir</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setBackupModalOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors active:scale-[0.98]"
                  >
                    <Upload className="w-5 h-5 text-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">Geri Yükle</p>
                      <p className="text-xs text-muted-foreground">ZIP dosyasından geri yükle</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
