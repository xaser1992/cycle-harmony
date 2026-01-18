// 🌸 Cycle Data Hook
import { useState, useEffect, useCallback } from 'react';
import type { CycleSettings, DayEntry, NotificationPreferences, UserSettings, CyclePrediction, CyclePhase } from '@/types/cycle';
import { DEFAULT_CYCLE_SETTINGS, DEFAULT_NOTIFICATION_PREFS, DEFAULT_USER_SETTINGS } from '@/types/cycle';
import * as storage from '@/lib/storage';
import { calculatePredictions, getCyclePhase } from '@/lib/predictions';
import { scheduleNotifications } from '@/lib/notifications';

export function useCycleData() {
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    // Reschedule notifications
    if (notificationPrefs.enabled) {
      await scheduleNotifications(pred, notificationPrefs, userSettings.language);
    }
  }, [cycleSettings, entries, notificationPrefs, userSettings.language]);

  // Save day entry
  const saveDayEntry = useCallback(async (entry: DayEntry) => {
    await storage.saveDayEntry(entry);
    const updatedEntries = await storage.getDayEntries();
    setEntries(updatedEntries);
  }, []);

  // Update notification preferences
  const updateNotificationPrefs = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...notificationPrefs, ...newPrefs };
    setNotificationPrefs(updated);
    await storage.saveNotificationPrefs(updated);

    if (prediction) {
      await scheduleNotifications(prediction, updated, userSettings.language);
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
