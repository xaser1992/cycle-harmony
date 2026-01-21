import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Bell, Calendar, Heart, CheckCircle2, User, Stethoscope, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCycleData } from '@/hooks/useCycleData';
import { format, subDays, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { requestNotificationPermissions } from '@/lib/notifications';
import { addCycleRecord } from '@/lib/storage';
import type { HealthCondition, ContraceptiveMethod } from '@/types/cycle';

const STEPS = ['welcome', 'personalInfo', 'healthInfo', 'cycleHistory', 'lastPeriod', 'cycleInfo', 'dataInfo', 'notifications', 'complete'] as const;
type Step = typeof STEPS[number];

interface PastPeriod {
  startDate: string;
  endDate: string;
}

const HEALTH_CONDITIONS: { id: HealthCondition; label: string; description: string }[] = [
  { id: 'pcos', label: 'PKOS', description: 'Polikistik over sendromu' },
  { id: 'endometriosis', label: 'Endometriozis', description: 'Rahim dışı doku büyümesi' },
  { id: 'thyroid', label: 'Tiroid', description: 'Tiroid bozuklukları' },
  { id: 'diabetes', label: 'Diyabet', description: 'Şeker hastalığı' },
  { id: 'none', label: 'Hiçbiri', description: 'Bilinen bir durum yok' },
];

const CONTRACEPTIVE_METHODS: { id: ContraceptiveMethod; label: string }[] = [
  { id: 'none', label: 'Kullanmıyorum' },
  { id: 'pill', label: 'Doğum kontrol hapı' },
  { id: 'iud', label: 'Spiral (RİA)' },
  { id: 'implant', label: 'İmplant' },
  { id: 'injection', label: 'Enjeksiyon' },
  { id: 'condom', label: 'Prezervatif' },
  { id: 'natural', label: 'Doğal yöntemler' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateCycleSettings, updateUserSettings, completeOnboarding } = useCycleData();
  const [step, setStep] = useState<Step>('welcome');
  
  // Personal info
  const [birthDate, setBirthDate] = useState('');
  
  // Health info
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>([]);
  const [contraceptiveMethod, setContraceptiveMethod] = useState<ContraceptiveMethod>('none');
  
  // Cycle history - past periods for better averaging
  const [pastPeriods, setPastPeriods] = useState<PastPeriod[]>([
    { startDate: '', endDate: '' },
    { startDate: '', endDate: '' },
    { startDate: '', endDate: '' },
  ]);
  
  // Current cycle info
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  
  // Notifications
  const [notificationPermission, setNotificationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const toggleHealthCondition = (condition: HealthCondition) => {
    if (condition === 'none') {
      setHealthConditions(['none']);
    } else {
      setHealthConditions(prev => {
        const filtered = prev.filter(c => c !== 'none');
        if (filtered.includes(condition)) {
          return filtered.filter(c => c !== condition);
        }
        return [...filtered, condition];
      });
    }
  };

  const updatePastPeriod = (index: number, field: 'startDate' | 'endDate', value: string) => {
    setPastPeriods(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateAverageCycleLength = (): number => {
    const validPeriods = pastPeriods.filter(p => p.startDate);
    if (validPeriods.length < 2) return 28;
    
    const cycleLengths: number[] = [];
    for (let i = 1; i < validPeriods.length; i++) {
      const days = differenceInDays(
        new Date(validPeriods[i].startDate),
        new Date(validPeriods[i - 1].startDate)
      );
      if (days > 0 && days < 60) {
        cycleLengths.push(Math.abs(days));
      }
    }
    
    if (cycleLengths.length === 0) return 28;
    return Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
  };

  const calculateAveragePeriodLength = (): number => {
    const validPeriods = pastPeriods.filter(p => p.startDate && p.endDate);
    if (validPeriods.length === 0) return 5;
    
    const lengths = validPeriods.map(p => 
      differenceInDays(new Date(p.endDate), new Date(p.startDate)) + 1
    ).filter(l => l > 0 && l < 15);
    
    if (lengths.length === 0) return 5;
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  };

  const handleNext = async () => {
    if (step === 'personalInfo') {
      await updateUserSettings({
        birthDate: birthDate || undefined,
      });
    }
    
    if (step === 'healthInfo') {
      await updateUserSettings({
        healthConditions,
        contraceptiveMethod,
      });
    }
    
    if (step === 'cycleHistory') {
      // Save cycle history and calculate averages
      const validPeriods = pastPeriods.filter(p => p.startDate);
      for (const period of validPeriods) {
        if (period.startDate) {
          const endDate = period.endDate || format(
            new Date(new Date(period.startDate).getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000),
            'yyyy-MM-dd'
          );
          const length = differenceInDays(new Date(endDate), new Date(period.startDate)) + 1;
          await addCycleRecord({
            startDate: period.startDate,
            endDate,
            length: length > 0 ? length : 5,
          });
        }
      }
      
      // Auto-calculate cycle length from history
      const avgCycle = calculateAverageCycleLength();
      const avgPeriod = calculateAveragePeriodLength();
      setCycleLength(avgCycle);
      setPeriodLength(avgPeriod);
    }
    
    if (step === 'cycleInfo') {
      // Use default date if not provided (14 days ago)
      const periodStart = lastPeriodDate || format(subDays(new Date(), 14), 'yyyy-MM-dd');
      await updateCycleSettings({
        lastPeriodStart: periodStart,
        cycleLength,
        periodLength,
        lutealPhase: 14,
      });
    }
    
    if (step === 'complete') {
      await completeOnboarding();
      navigate('/');
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex]);
    }
  };

  const canProceed = () => {
    return true;
  };


  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {currentIndex + 1} / {STEPS.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step === 'welcome' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.span 
                  className="text-7xl mb-6"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🌸
                </motion.span>
                <h1 className="text-3xl font-bold text-foreground mb-3">Döngü Takibi</h1>
                <p className="text-muted-foreground text-lg max-w-xs">
                  Sağlığını takip et, kendini daha iyi tanı.
                </p>
                <Card className="mt-8 p-4 bg-secondary/50 border-0 max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    🔒 Verileriniz yalnızca cihazınızda saklanır ve tamamen gizlidir.
                  </p>
                </Card>
              </div>
            )}

            {step === 'personalInfo' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-6">
                  <User className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Kişisel Bilgiler</h2>
                  <p className="text-muted-foreground">Daha doğru tahminler için doğum tarihini gir.</p>
                </div>
                
                <Card className="p-4 bg-card border-border">
                  <label className="text-sm text-muted-foreground block mb-2">Doğum Tarihi</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full text-lg p-3 rounded-lg bg-muted border-0 text-foreground"
                  />
                </Card>
                
                {birthDate && (
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    {format(new Date(birthDate), 'd MMMM yyyy', { locale: tr })}
                  </p>
                )}
                
                <p className="mt-4 text-xs text-muted-foreground text-center opacity-70">
                  Bu bilgi isteğe bağlıdır ve yalnızca yaşa göre tahmin iyileştirmeleri için kullanılır.
                </p>
              </div>
            )}

            {step === 'healthInfo' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-6">
                  <Stethoscope className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Sağlık Bilgileri</h2>
                  <p className="text-muted-foreground">Döngünü etkileyebilecek durumları seç.</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <label className="text-sm font-medium text-foreground">Sağlık Durumları</label>
                  {HEALTH_CONDITIONS.map((condition) => (
                    <Card 
                      key={condition.id}
                      className={`p-3 cursor-pointer transition-all ${
                        healthConditions.includes(condition.id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border'
                      }`}
                      onClick={() => toggleHealthCondition(condition.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          healthConditions.includes(condition.id)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {healthConditions.includes(condition.id) && (
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{condition.label}</p>
                          <p className="text-xs text-muted-foreground">{condition.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Doğum Kontrol Yöntemi</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTRACEPTIVE_METHODS.map((method) => (
                      <Card 
                        key={method.id}
                        className={`p-3 cursor-pointer transition-all text-center ${
                          contraceptiveMethod === method.id
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card border-border'
                        }`}
                        onClick={() => setContraceptiveMethod(method.id)}
                      >
                        <p className="text-sm font-medium text-foreground">{method.label}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 'cycleHistory' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-6">
                  <History className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Geçmiş Döngüler</h2>
                  <p className="text-muted-foreground">Son 3 regl dönemini gir. Daha iyi tahminler için önemli!</p>
                </div>
                
                <div className="space-y-4">
                  {pastPeriods.map((period, index) => (
                    <Card key={index} className="p-4 bg-card border-border">
                      <p className="text-sm font-medium text-foreground mb-3">
                        {index + 1}. Dönem {index === 0 && <span className="text-muted-foreground">(En eski)</span>}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Başlangıç</label>
                          <input
                            type="date"
                            value={period.startDate}
                            onChange={(e) => updatePastPeriod(index, 'startDate', e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full text-sm p-2 rounded-lg bg-muted border-0 text-foreground mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Bitiş</label>
                          <input
                            type="date"
                            value={period.endDate}
                            onChange={(e) => updatePastPeriod(index, 'endDate', e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            min={period.startDate}
                            className="w-full text-sm p-2 rounded-lg bg-muted border-0 text-foreground mt-1"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Hatırlamıyorsan boş bırakabilirsin. Tahmini değerler kullanılacak.
                </p>
              </div>
            )}

            {step === 'lastPeriod' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-8">
                  <Calendar className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Son Regl Tarihin</h2>
                  <p className="text-muted-foreground">En son regl döneminin <strong>başladığı</strong> tarihi seç.</p>
                </div>
                <Card className="p-4 bg-card border-border">
                  <input
                    type="date"
                    value={lastPeriodDate}
                    onChange={(e) => setLastPeriodDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    placeholder="Tarih seç"
                    className="w-full text-lg p-3 rounded-lg bg-muted border-0 text-foreground"
                  />
                </Card>
                {lastPeriodDate && (
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    {format(new Date(lastPeriodDate), 'd MMMM yyyy', { locale: tr })}
                  </p>
                )}
              </div>
            )}

            {step === 'cycleInfo' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-6">
                  <Heart className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Döngü Bilgilerin</h2>
                  <p className="text-muted-foreground">
                    {pastPeriods.some(p => p.startDate) 
                      ? 'Geçmiş döngülerinden hesaplandı. Gerekirse düzenleyebilirsin.'
                      : 'Ortalama değerleri bilmiyorsan varsayılanları kullanabilirsin.'}
                  </p>
                </div>
                
                <div className="space-y-6">
                  <Card className="p-4 bg-card border-border">
                    <label className="text-sm text-muted-foreground">Döngü Uzunluğu (gün)</label>
                    <div className="flex items-center gap-4 mt-2">
                      <Button variant="outline" size="icon" onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}>-</Button>
                      <span className="text-2xl font-bold text-foreground flex-1 text-center">{cycleLength}</span>
                      <Button variant="outline" size="icon" onClick={() => setCycleLength(Math.min(40, cycleLength + 1))}>+</Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Bir reglin başlangıcından diğerine kadar geçen gün sayısı
                    </p>
                  </Card>

                  <Card className="p-4 bg-card border-border">
                    <label className="text-sm text-muted-foreground">Regl Süresi (gün)</label>
                    <div className="flex items-center gap-4 mt-2">
                      <Button variant="outline" size="icon" onClick={() => setPeriodLength(Math.max(2, periodLength - 1))}>-</Button>
                      <span className="text-2xl font-bold text-foreground flex-1 text-center">{periodLength}</span>
                      <Button variant="outline" size="icon" onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}>+</Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Regl kanamasının sürdüğü ortalama gün sayısı
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {step === 'dataInfo' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-5xl mb-4 block">📊</span>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Veri Toplama Hakkında</h2>
                  <p className="text-muted-foreground">
                    Kişiselleştirilmiş tahminler için verilerine ihtiyacımız var.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Card className="p-4 bg-amber/10 border-amber/30">
                    <div className="flex gap-3">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <p className="font-medium text-foreground">İlk 2-3 Döngü</p>
                        <p className="text-sm text-muted-foreground">
                          Uygulama, seni tanımak için ilk 2-3 regl döngünü takip etmeli. Bu süre yaklaşık <strong>2-3 ay</strong> sürer.
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-medium text-foreground">Daha Doğru Tahminler</p>
                        <p className="text-sm text-muted-foreground">
                          Ne kadar çok veri girersen, tahminler o kadar doğru olur. Günlük semptomlarm ve ruh halin özellikle yardımcı olur.
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-emerald/10 border-emerald/30">
                    <div className="flex gap-3">
                      <span className="text-2xl">✨</span>
                      <div>
                        <p className="font-medium text-foreground">Şimdilik Varsayılan Değerler</p>
                        <p className="text-sm text-muted-foreground">
                          Geçmiş döngü bilgilerini girmediysen, ortalama değerler (28 gün döngü, 5 gün regl) kullanılacak ve zamanla kişiselleştirilecek.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {step === 'notifications' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-6">
                  <Bell className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Bildirimler</h2>
                  <p className="text-muted-foreground">
                    Döngün hakkında zamanında hatırlatmalar almak için bildirim iznine ihtiyacımız var.
                  </p>
                </div>
                
                <Card className="p-5 bg-period-light border-0 mb-6">
                  <div className="space-y-3 text-sm">
                    <p>✓ Regl yaklaşıyor bildirimi</p>
                    <p>✓ Yumurtlama günü hatırlatması</p>
                    <p>✓ PMS dönemi uyarısı</p>
                    <p>✓ İlaç hatırlatmaları</p>
                  </div>
                </Card>

                {/* Permission Request Button - Always visible if not granted */}
                {notificationPermission !== 'granted' && (
                  <Button
                    size="lg"
                    onClick={async () => {
                      setIsRequestingPermission(true);
                      try {
                        const granted = await requestNotificationPermissions();
                        setNotificationPermission(granted ? 'granted' : 'denied');
                      } catch (error) {
                        console.error('Permission request error:', error);
                        setNotificationPermission('denied');
                      } finally {
                        setIsRequestingPermission(false);
                      }
                    }}
                    disabled={isRequestingPermission}
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isRequestingPermission ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        {notificationPermission === 'denied' 
                          ? 'Tekrar Dene' 
                          : 'Bildirimlere İzin Ver'}
                      </>
                    )}
                  </Button>
                )}

                {notificationPermission === 'granted' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center gap-2 p-4 bg-emerald/20 rounded-2xl text-emerald"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-medium">Bildirimler açık!</span>
                  </motion.div>
                )}

                {notificationPermission === 'denied' && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 bg-amber/20 rounded-xl text-amber text-center mt-2"
                  >
                    <p className="text-xs opacity-80">
                      Bildirimlere izin verilmedi. Yukarıdaki butona tıklayarak tekrar deneyebilirsin.
                    </p>
                  </motion.div>
                )}

                <p className="mt-4 text-xs text-muted-foreground text-center">
                  İstediğin zaman ayarlardan değiştirebilirsin.
                </p>
              </div>
            )}

            {step === 'complete' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.span 
                  className="text-7xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  🎉
                </motion.span>
                <h2 className="text-2xl font-bold text-foreground mb-3">Hazırsın!</h2>
                <p className="text-muted-foreground max-w-xs">
                  Döngünü takip etmeye başlayabilirsin. Kendine iyi bak! 🌸
                </p>
                
                {pastPeriods.some(p => p.startDate) && (
                  <Card className="mt-6 p-4 bg-primary/10 border-0 max-w-xs">
                    <p className="text-sm text-foreground">
                      📊 Geçmiş {pastPeriods.filter(p => p.startDate).length} döngüye göre tahminlerin kişiselleştirildi.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 space-y-3">
        <div className="flex gap-4">
          {currentIndex > 0 && step !== 'complete' && (
            <Button variant="outline" size="lg" onClick={handleBack} className="rounded-2xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Button 
            size="lg" 
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 rounded-2xl period-gradient text-white"
          >
            {step === 'complete' ? 'Başla' : 'Devam'}
            {step !== 'complete' && <ChevronRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
