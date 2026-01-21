// 🌸 App Tour - Performance Optimized (No framer-motion)
import { useState, useEffect, useCallback, forwardRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Preferences } from '@capacitor/preferences';

const TOUR_COMPLETED_KEY = 'app_tour_completed';

interface TourStep {
  id: string;
  emoji: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    emoji: '🌸',
    titleTr: 'Hoş Geldin!',
    titleEn: 'Welcome!',
    descriptionTr: 'Döngü takip uygulamanız hazır. Size özellikleri kısaca tanıtalım.',
    descriptionEn: 'Your cycle tracking app is ready. Let us quickly show you the features.',
  },
  {
    id: 'today',
    emoji: '📅',
    titleTr: 'Bugün Sayfası',
    titleEn: 'Today Page',
    descriptionTr: 'Ana sayfada döngünüzün hangi aşamasında olduğunuzu ve bir sonraki regl tahmininizi görebilirsiniz.',
    descriptionEn: 'On the main page, you can see which phase of your cycle you\'re in and your next period prediction.',
  },
  {
    id: 'log',
    emoji: '➕',
    titleTr: 'Günlük Kayıt',
    titleEn: 'Daily Logging',
    descriptionTr: 'Alt menüdeki + butonuna basarak regl durumu, belirtiler ve ruh halinizi kolayca kaydedin.',
    descriptionEn: 'Tap the + button in the bottom menu to easily log your period, symptoms and mood.',
  },
  {
    id: 'calendar',
    emoji: '🗓️',
    titleTr: 'Takvim',
    titleEn: 'Calendar',
    descriptionTr: 'Takvim sayfasında geçmiş ve gelecek döngülerinizi görsel olarak takip edin.',
    descriptionEn: 'View your past and future cycles visually on the calendar page.',
  },
  {
    id: 'stats',
    emoji: '📊',
    titleTr: 'İstatistikler',
    titleEn: 'Statistics',
    descriptionTr: 'İstatistikler sayfasında döngü uzunluğu, belirtiler ve ruh hali trendlerinizi analiz edin.',
    descriptionEn: 'Analyze your cycle length, symptoms and mood trends on the statistics page.',
  },
  {
    id: 'medications',
    emoji: '💊',
    titleTr: 'İlaç Takibi',
    titleEn: 'Medication Tracking',
    descriptionTr: 'İlaçlarınızı ekleyin ve hatırlatıcılar ayarlayın. Asla bir dozu kaçırmayın!',
    descriptionEn: 'Add your medications and set reminders. Never miss a dose!',
  },
  {
    id: 'ready',
    emoji: '✨',
    titleTr: 'Hazırsınız!',
    titleEn: 'You\'re Ready!',
    descriptionTr: 'Artık başlayabilirsiniz. Sorularınız için Ayarlar > Yardım sayfasını ziyaret edebilirsiniz.',
    descriptionEn: 'You\'re all set! Visit Settings > Help if you have any questions.',
  },
];

interface AppTourProps {
  language: 'tr' | 'en';
  onComplete?: () => void;
}

export const AppTour = forwardRef<HTMLDivElement, AppTourProps>(function AppTour({ language, onComplete }, ref) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkTourStatus();
  }, []);

  const checkTourStatus = async () => {
    try {
      const { value } = await Preferences.get({ key: TOUR_COMPLETED_KEY });
      if (value !== 'true') {
        // Small delay to let the main UI render first
        setTimeout(() => setIsVisible(true), 500);
      }
    } catch (error) {
      console.error('Error checking tour status:', error);
    }
  };

  const completeTour = useCallback(async () => {
    try {
      await Preferences.set({ key: TOUR_COMPLETED_KEY, value: 'true' });
    } catch (error) {
      console.error('Error saving tour status:', error);
    }
    setIsVisible(false);
    onComplete?.();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10 active:scale-90"
          aria-label={language === 'tr' ? 'Atla' : 'Skip'}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Emoji */}
          <div
            key={step.id}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-scale-in"
          >
            <span className="text-4xl">{step.emoji}</span>
          </div>

          {/* Title */}
          <h2
            key={`title-${step.id}`}
            className="text-2xl font-bold text-center text-foreground mb-3 animate-fade-in"
          >
            {language === 'tr' ? step.titleTr : step.titleEn}
          </h2>

          {/* Description */}
          <p
            key={`desc-${step.id}`}
            className="text-center text-muted-foreground leading-relaxed animate-fade-in"
          >
            {language === 'tr' ? step.descriptionTr : step.descriptionEn}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-4">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-6 bg-primary' 
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Step ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 p-4 pt-0">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 rounded-xl h-12"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === 'tr' ? 'Geri' : 'Back'}
            </Button>
          )}
          <Button
            onClick={handleNext}
            className={`rounded-xl h-12 ${isFirstStep ? 'flex-1' : 'flex-1'}`}
          >
            {isLastStep 
              ? (language === 'tr' ? 'Başla' : 'Start')
              : (language === 'tr' ? 'İleri' : 'Next')
            }
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
});
