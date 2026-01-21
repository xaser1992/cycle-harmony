// 🌸 Main Today Page
import { useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useCycleData } from '@/hooks/useCycleData';
import { TodayCard } from '@/components/TodayCard';
import { PhaseTimeline } from '@/components/PhaseTimeline';
import { BottomNav } from '@/components/BottomNav';
import { GlobalHeader } from '@/components/GlobalHeader';
import { AppTour } from '@/components/AppTour';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import type { DayEntry } from '@/types/cycle';

const Index = forwardRef<HTMLDivElement, {}>(function Index(props, ref) {
  const navigate = useNavigate();
  const { openUpdateSheet } = useUpdateSheet();
  const { 
    userSettings, 
    cycleSettings,
    currentPhase, 
    prediction, 
    entries,
    saveDayEntry,
    isLoading 
  } = useCycleData();

  // Swipe navigation - tab arası geçiş için
  useSwipeNavigation({ threshold: 60 });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !userSettings.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [isLoading, userSettings.onboardingCompleted, navigate]);

  // Get today's entry if exists
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = entries.find(e => e.date === todayDate);
  const isOnPeriod = todayEntry?.flowLevel !== 'none' && todayEntry?.flowLevel !== undefined;

  const handleLogPeriod = async () => {
    const newEntry: DayEntry = {
      date: todayDate,
      flowLevel: isOnPeriod ? 'none' : 'medium',
      symptoms: todayEntry?.symptoms || [],
      mood: todayEntry?.mood,
      notes: todayEntry?.notes,
    };
    await saveDayEntry(newEntry);
  };

  const handleLogSymptoms = () => {
    openUpdateSheet({ initialTab: 'symptoms' });
  };

  const handleOpenUpdate = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
          <span className="text-2xl">🌸</span>
        </div>
      </div>
    );
  }

  if (!userSettings.onboardingCompleted) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background pb-24 safe-area-top">
      {/* Global Header - Settings & Notifications (positioned absolutely, scrolls with page) */}
      <GlobalHeader />

      {/* Header */}
      <header className="px-6 pt-20 pb-4">
        <div className="flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE', { locale: userSettings.language === 'tr' ? tr : enUS })}
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              {format(new Date(), 'd MMMM', { locale: userSettings.language === 'tr' ? tr : enUS })}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-6">
        {/* Today Status Card - Tap to open UpdateSheet */}
        <TodayCard 
          phase={currentPhase} 
          prediction={prediction}
          language={userSettings.language}
          onTap={() => handleOpenUpdate()}
        />

        {/* Phase Timeline */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <PhaseTimeline 
            prediction={prediction}
            settings={cycleSettings}
            language={userSettings.language}
          />
        </div>

        {/* Quick Actions - Period button only */}
        <div>
          <button
            onClick={handleLogPeriod}
            className={`w-full relative overflow-hidden rounded-2xl p-4 transition-all duration-200 active:scale-95 active:brightness-110 ${
              isOnPeriod 
                ? 'bg-gradient-to-br from-emerald to-teal shadow-lg shadow-emerald/30'
                : 'bg-gradient-to-br from-rose to-pink shadow-lg shadow-rose/30'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xl">{isOnPeriod ? '✓' : '🩸'}</span>
              </div>
              <span className="text-base font-semibold text-white">
                {isOnPeriod 
                  ? (userSettings.language === 'tr' ? 'Regl Bitti' : 'Period Ended')
                  : (userSettings.language === 'tr' ? 'Regl Başladı' : 'Period Started')
                }
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav onCenterPress={handleOpenUpdate} />

      {/* App Tour - shows after onboarding */}
      <AppTour language={userSettings.language} />
    </div>
  );
});

export default Index;
