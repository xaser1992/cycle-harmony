// 🌸 Cycle Data Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import type { CycleSettings, DayEntry, NotificationPreferences, UserSettings, CyclePrediction, CyclePhase } from '@/types/cycle';
import { DEFAULT_CYCLE_SETTINGS, DEFAULT_NOTIFICATION_PREFS, DEFAULT_USER_SETTINGS } from '@/types/cycle';
import * as storage from '@/lib/storage';
import { calculatePredictions, getCyclePhase } from '@/lib/predictions';
import { scheduleNotifications, createNotificationChannels, checkNotificationPermissions } from '@/lib/notifications';
import { Capacitor } from '@capacitor/core';

export function useCycleData() {
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasScheduledNotifications = useRef(false);

  // Load all data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [settings, dayEntries, notifPrefs, userPrefs, history] = await Promise.all([
          storage.getCycleSettings(),
          storage.getDayEntries(),
          storage.getNotificationPrefs(),
          storage.getUserSettings(),
          storage.getCycleHistory(),
        ]);

        if (settings) setCycleSettings(settings);
        if (dayEntries) setEntries(dayEntries);
        if (notifPrefs) setNotificationPrefs(notifPrefs);
        if (userPrefs) setUserSettings(userPrefs);

        // Calculate predictions
        const currentSettings = settings || DEFAULT_CYCLE_SETTINGS;
        const pred = calculatePredictions(currentSettings, history);
        setPrediction(pred);

        // Get current phase
        const phase = getCyclePhase(new Date(), currentSettings, pred, dayEntries || []);
        setCurrentPhase(phase);

        // Schedule notifications on initial load (only on native platforms)
        const finalNotifPrefs = notifPrefs || DEFAULT_NOTIFICATION_PREFS;
        const finalUserSettings = userPrefs || DEFAULT_USER_SETTINGS;
        
        if (pred && finalNotifPrefs.enabled && !hasScheduledNotifications.current) {
          hasScheduledNotifications.current = true;
          
          // Only run on native platforms
          if (Capacitor.isNativePlatform()) {
            try {
              await createNotificationChannels();
              const hasPermission = await checkNotificationPermissions();
              if (hasPermission) {
                await scheduleNotifications(pred, finalNotifPrefs, finalUserSettings.language);
                console.log('Initial notifications scheduled');
              }
            } catch (error) {
              console.warn('Could not schedule initial notifications:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading cycle data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update cycle settings
  const updateCycleSettings = useCallback(async (newSettings: Partial<CycleSettings>) => {
    const updated = { ...cycleSettings, ...newSettings };
    setCycleSettings(updated);
    await storage.saveCycleSettings(updated);

    // Recalculate predictions
    const history = await storage.getCycleHistory();
    const pred = calculatePredictions(updated, history);
    setPrediction(pred);
    setCurrentPhase(getCyclePhase(new Date(), updated, pred, entries));

    // Reschedule notifications (only on native platforms)
    if (notificationPrefs.enabled && Capacitor.isNativePlatform()) {
      try {
        await scheduleNotifications(pred, notificationPrefs, userSettings.language);
      } catch (error) {
        console.warn('Could not reschedule notifications:', error);
      }
    }
  }, [cycleSettings, entries, notificationPrefs, userSettings.language]);

  // Save day entry - recalculates predictions if flow level changes
  const saveDayEntry = useCallback(async (entry: DayEntry) => {
    await storage.saveDayEntry(entry);
    const updatedEntries = await storage.getDayEntries();
    setEntries(updatedEntries);
    
    // Check if this is a period entry - recalculate predictions
    if (entry.flowLevel && entry.flowLevel !== 'none') {
      // Find the earliest period day in current cycle to use as lastPeriodStart
      const periodEntries = updatedEntries
        .filter(e => e.flowLevel && e.flowLevel !== 'none')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (periodEntries.length > 0) {
        // Find the most recent "first day" of a period (gap of more than 7 days from previous period)
        let lastPeriodStartDate = periodEntries[0].date;
        
        for (let i = periodEntries.length - 1; i >= 0; i--) {
          if (i === 0) {
            lastPeriodStartDate = periodEntries[0].date;
            break;
          }
          
          const currentDate = new Date(periodEntries[i].date);
          const prevDate = new Date(periodEntries[i - 1].date);
          const daysDiff = Math.abs((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // If gap is more than 7 days, this is a new cycle's first day
          if (daysDiff > 7) {
            lastPeriodStartDate = periodEntries[i].date;
            break;
          }
        }
        
        // Update cycle settings with new lastPeriodStart
        const updatedSettings = { ...cycleSettings, lastPeriodStart: lastPeriodStartDate };
        setCycleSettings(updatedSettings);
        await storage.saveCycleSettings(updatedSettings);
        
        // Recalculate predictions with updated settings
        const history = await storage.getCycleHistory();
        const pred = calculatePredictions(updatedSettings, history);
        setPrediction(pred);
        setCurrentPhase(getCyclePhase(new Date(), updatedSettings, pred, updatedEntries));
        
        // Reschedule notifications if enabled (only on native platforms)
        if (notificationPrefs.enabled && Capacitor.isNativePlatform() && pred) {
          try {
            await scheduleNotifications(pred, notificationPrefs, userSettings.language);
          } catch (error) {
            console.warn('Could not reschedule notifications after period entry:', error);
          }
        }
      }
    } else {
      // Still update current phase for non-period entries
      if (prediction) {
        setCurrentPhase(getCyclePhase(new Date(), cycleSettings, prediction, updatedEntries));
      }
    }
  }, [cycleSettings, notificationPrefs, prediction, userSettings.language]);

  // Update notification preferences
  const updateNotificationPrefs = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...notificationPrefs, ...newPrefs };
    setNotificationPrefs(updated);
    await storage.saveNotificationPrefs(updated);

    // Schedule notifications (only on native platforms)
    if (prediction && Capacitor.isNativePlatform()) {
      try {
        await scheduleNotifications(prediction, updated, userSettings.language);
      } catch (error) {
        console.warn('Could not schedule notifications:', error);
      }
    }
  }, [notificationPrefs, prediction, userSettings.language]);

  // Update user settings
  const updateUserSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    await storage.saveUserSettings(updated);
  }, [userSettings]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    await updateUserSettings({ onboardingCompleted: true });
  }, [updateUserSettings]);

  return {
    cycleSettings,
    entries,
    notificationPrefs,
    userSettings,
    prediction,
    currentPhase,
    isLoading,
    updateCycleSettings,
    saveDayEntry,
    updateNotificationPrefs,
    updateUserSettings,
    completeOnboarding,
  };
}
