import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Bell, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCycleData } from '@/hooks/useCycleData';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';

const STEPS = ['welcome', 'lastPeriod', 'cycleInfo', 'notifications', 'complete'] as const;
type Step = typeof STEPS[number];

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateCycleSettings, updateNotificationPrefs, completeOnboarding } = useCycleData();
  const [step, setStep] = useState<Step>('welcome');
  const [lastPeriodDate, setLastPeriodDate] = useState(format(subDays(new Date(), 14), 'yyyy-MM-dd'));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);

  const currentIndex = STEPS.indexOf(step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    if (step === 'cycleInfo') {
      await updateCycleSettings({
        lastPeriodStart: lastPeriodDate,
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
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8">
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

            {step === 'lastPeriod' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-8">
                  <Calendar className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Son Regl Tarihin</h2>
                  <p className="text-muted-foreground">Son regl döneminin başladığı tarihi seç.</p>
                </div>
                <Card className="p-4 bg-card border-border">
                  <input
                    type="date"
                    value={lastPeriodDate}
                    onChange={(e) => setLastPeriodDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full text-lg p-3 rounded-lg bg-muted border-0 text-foreground"
                  />
                </Card>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  {format(new Date(lastPeriodDate), 'd MMMM yyyy', { locale: tr })}
                </p>
              </div>
            )}

            {step === 'cycleInfo' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-8">
                  <Heart className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Döngü Bilgilerin</h2>
                  <p className="text-muted-foreground">Ortalama değerleri bilmiyorsan varsayılanları kullanabilirsin.</p>
                </div>
                
                <div className="space-y-6">
                  <Card className="p-4 bg-card border-border">
                    <label className="text-sm text-muted-foreground">Döngü Uzunluğu (gün)</label>
                    <div className="flex items-center gap-4 mt-2">
                      <Button variant="outline" size="icon" onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}>-</Button>
                      <span className="text-2xl font-bold text-foreground flex-1 text-center">{cycleLength}</span>
                      <Button variant="outline" size="icon" onClick={() => setCycleLength(Math.min(40, cycleLength + 1))}>+</Button>
                    </div>
                  </Card>

                  <Card className="p-4 bg-card border-border">
                    <label className="text-sm text-muted-foreground">Regl Süresi (gün)</label>
                    <div className="flex items-center gap-4 mt-2">
                      <Button variant="outline" size="icon" onClick={() => setPeriodLength(Math.max(2, periodLength - 1))}>-</Button>
                      <span className="text-2xl font-bold text-foreground flex-1 text-center">{periodLength}</span>
                      <Button variant="outline" size="icon" onClick={() => setPeriodLength(Math.min(10, periodLength + 1))}>+</Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {step === 'notifications' && (
              <div className="flex-1 flex flex-col">
                <div className="mb-8">
                  <Bell className="w-12 h-12 text-primary mb-4" />
                  <h2 className="text-2xl font-bold text-foreground mb-2">Bildirimler</h2>
                  <p className="text-muted-foreground">Döngün hakkında zamanında hatırlatmalar al.</p>
                </div>
                <Card className="p-6 bg-period-light border-0">
                  <div className="space-y-3 text-sm">
                    <p>✓ Regl yaklaşıyor bildirimi</p>
                    <p>✓ Yumurtlama günü hatırlatması</p>
                    <p>✓ PMS dönemi uyarısı</p>
                    <p>✓ Günlük check-in</p>
                  </div>
                </Card>
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Tüm bildirimler varsayılan olarak açıktır. Ayarlardan değiştirebilirsin.
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
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 flex gap-4">
        {currentIndex > 0 && step !== 'complete' && (
          <Button variant="outline" size="lg" onClick={handleBack} className="rounded-2xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <Button 
          size="lg" 
          onClick={handleNext}
          className="flex-1 rounded-2xl period-gradient text-white"
        >
          {step === 'complete' ? 'Başla' : 'Devam'}
          {step !== 'complete' && <ChevronRight className="w-5 h-5 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
