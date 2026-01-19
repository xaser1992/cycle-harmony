// 🌸 Main Today Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCycleData } from '@/hooks/useCycleData';
import { TodayCard } from '@/components/TodayCard';
import { QuickActions } from '@/components/QuickActions';
import { PhaseTimeline } from '@/components/PhaseTimeline';
import { BottomNav } from '@/components/BottomNav';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import type { DayEntry } from '@/types/cycle';

const Index = () => {
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
        <motion.div 
          className="text-primary"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl">🌸</span>
          </div>
        </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE', { locale: tr })}
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              {format(new Date(), 'd MMMM', { locale: tr })}
            </h1>
          </div>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="px-6 space-y-6">
        {/* Today Status Card */}
        <TodayCard 
          phase={currentPhase} 
          prediction={prediction}
          language={userSettings.language}
        />

        {/* Phase Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <PhaseTimeline 
            prediction={prediction}
            settings={cycleSettings}
            language={userSettings.language}
          />
        </motion.div>

        {/* Quick Actions - Moved period and symptom logging */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuickActions
            onLogPeriod={handleLogPeriod}
            onLogSymptoms={handleLogSymptoms}
            language={userSettings.language}
            isOnPeriod={isOnPeriod}
          />
        </motion.div>

        {/* Today's Log Summary */}
        {todayEntry && (todayEntry.symptoms.length > 0 || todayEntry.mood) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {userSettings.language === 'tr' ? "Bugünün Kaydı" : "Today's Log"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {todayEntry.mood && (
                <span className="px-3 py-1 bg-accent/20 rounded-full text-sm">
                  {userSettings.language === 'tr' ? 'Ruh hali' : 'Mood'}: {todayEntry.mood}
                </span>
              )}
              {todayEntry.symptoms.map(symptom => (
                <span key={symptom} className="px-3 py-1 bg-secondary rounded-full text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav onCenterPress={handleOpenUpdate} />
    </div>
  );
};

export default Index;
