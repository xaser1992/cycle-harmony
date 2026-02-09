// 🌸 Shared Cycle Data Context - Single data source for all pages
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { CycleSettings, DayEntry, NotificationPreferences, UserSettings, CyclePrediction, CyclePhase } from '@/types/cycle';
import { DEFAULT_CYCLE_SETTINGS, DEFAULT_NOTIFICATION_PREFS, DEFAULT_USER_SETTINGS } from '@/types/cycle';
import * as storage from '@/lib/storage';
import { calculatePredictions, getCyclePhase } from '@/lib/predictions';
import { scheduleNotifications, createNotificationChannels, checkNotificationPermissions } from '@/lib/notifications';
import { Capacitor } from '@capacitor/core';

interface CycleDataContextType {
  cycleSettings: CycleSettings;
  entries: DayEntry[];
  notificationPrefs: NotificationPreferences;
  userSettings: UserSettings;
  prediction: CyclePrediction | null;
  currentPhase: CyclePhase | null;
  isLoading: boolean;
  updateCycleSettings: (newSettings: Partial<CycleSettings>) => Promise<void>;
  saveDayEntry: (entry: DayEntry) => Promise<void>;
  updateNotificationPrefs: (newPrefs: Partial<NotificationPreferences>) => Promise<void>;
  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const CycleDataContext = createContext<CycleDataContextType | null>(null);

export function CycleDataProvider({ children }: { children: ReactNode }) {
  const [cycleSettings, setCycleSettings] = useState<CycleSettings>(DEFAULT_CYCLE_SETTINGS);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [currentPhase, setCurrentPhase] = useState<CyclePhase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasScheduledNotifications = useRef(false);

  // Load all data on mount - runs ONCE for the entire app
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      try {
        const [settings, dayEntries, notifPrefs, userPrefs, history] = await Promise.all([
          storage.getCycleSettings(),
          storage.getDayEntries(),
          storage.getNotificationPrefs(),
          storage.getUserSettings(),
          storage.getCycleHistory(),
        ]);

        if (!isMounted) return;

        const currentSettings = settings || DEFAULT_CYCLE_SETTINGS;
        const currentEntries = dayEntries || [];
        const currentNotifPrefs = notifPrefs || DEFAULT_NOTIFICATION_PREFS;
        const currentUserPrefs = userPrefs || DEFAULT_USER_SETTINGS;
        
        const pred = calculatePredictions(currentSettings, history);
        const phase = getCyclePhase(new Date(), currentSettings, pred, currentEntries);

        if (settings) setCycleSettings(settings);
        setEntries(currentEntries);
        if (notifPrefs) setNotificationPrefs(notifPrefs);
        if (userPrefs) setUserSettings(userPrefs);
        setPrediction(pred);
        setCurrentPhase(phase);
        setIsLoading(false);

        if (pred && currentNotifPrefs.enabled && !hasScheduledNotifications.current && Capacitor.isNativePlatform()) {
          hasScheduledNotifications.current = true;
          setTimeout(async () => {
            try {
              await createNotificationChannels();
              const hasPermission = await checkNotificationPermissions();
              if (hasPermission) {
                const result = await scheduleNotifications(pred, currentNotifPrefs, currentUserPrefs.language);
                if (result.errors.length > 0) {
                  console.warn('Notification scheduling issues:', result.errors);
                }
              }
            } catch (error) {
              console.warn('Could not schedule initial notifications:', error);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error loading cycle data:', error);
        if (isMounted) setIsLoading(false);
      }
    }
    
    loadData();
    return () => { isMounted = false; };
  }, []);

  const updateCycleSettings = useCallback(async (newSettings: Partial<CycleSettings>) => {
    const updated = { ...cycleSettings, ...newSettings };
    setCycleSettings(updated);
    await storage.saveCycleSettings(updated);

    const history = await storage.getCycleHistory();
    const pred = calculatePredictions(updated, history);
    setPrediction(pred);
    setCurrentPhase(getCyclePhase(new Date(), updated, pred, entries));

    if (notificationPrefs.enabled && Capacitor.isNativePlatform()) {
      try {
        const result = await scheduleNotifications(pred, notificationPrefs, userSettings.language);
        if (result.errors.length > 0) console.warn('Notification reschedule issues:', result.errors);
      } catch (error) {
        console.warn('Could not reschedule notifications:', error);
      }
    }
  }, [cycleSettings, entries, notificationPrefs, userSettings.language]);

  const saveDayEntry = useCallback(async (entry: DayEntry) => {
    await storage.saveDayEntry(entry);
    const updatedEntries = await storage.getDayEntries();
    setEntries(updatedEntries);
    
    if (entry.flowLevel && entry.flowLevel !== 'none') {
      const periodEntries = updatedEntries
        .filter(e => e.flowLevel && e.flowLevel !== 'none')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (periodEntries.length > 0) {
        let lastPeriodStartDate = periodEntries[0].date;
        
        for (let i = periodEntries.length - 1; i >= 0; i--) {
          if (i === 0) { lastPeriodStartDate = periodEntries[0].date; break; }
          const currentDate = new Date(periodEntries[i].date);
          const prevDate = new Date(periodEntries[i - 1].date);
          const daysDiff = Math.abs((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 7) { lastPeriodStartDate = periodEntries[i].date; break; }
        }
        
        const updatedSettings = { ...cycleSettings, lastPeriodStart: lastPeriodStartDate };
        setCycleSettings(updatedSettings);
        await storage.saveCycleSettings(updatedSettings);
        
        const history = await storage.getCycleHistory();
        const pred = calculatePredictions(updatedSettings, history);
        setPrediction(pred);
        setCurrentPhase(getCyclePhase(new Date(), updatedSettings, pred, updatedEntries));
        
        if (notificationPrefs.enabled && Capacitor.isNativePlatform() && pred) {
          try {
            const result = await scheduleNotifications(pred, notificationPrefs, userSettings.language);
            if (result.errors.length > 0) console.warn('Notification reschedule issues:', result.errors);
          } catch (error) {
            console.warn('Could not reschedule notifications:', error);
          }
        }
      }
    } else {
      if (prediction) {
        setCurrentPhase(getCyclePhase(new Date(), cycleSettings, prediction, updatedEntries));
      }
    }
  }, [cycleSettings, notificationPrefs, prediction, userSettings.language]);

  const updateNotificationPrefs = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...notificationPrefs, ...newPrefs };
    setNotificationPrefs(updated);
    await storage.saveNotificationPrefs(updated);

    if (prediction && Capacitor.isNativePlatform()) {
      try {
        const result = await scheduleNotifications(prediction, updated, userSettings.language);
        if (result.errors.length > 0) console.warn('Notification schedule issues:', result.errors);
      } catch (error) {
        console.warn('Could not schedule notifications:', error);
      }
    }
  }, [notificationPrefs, prediction, userSettings.language]);

  const updateUserSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    await storage.saveUserSettings(updated);
  }, [userSettings]);

  const completeOnboarding = useCallback(async () => {
    await updateUserSettings({ onboardingCompleted: true });
  }, [updateUserSettings]);

  return (
    <CycleDataContext.Provider value={{
      cycleSettings, entries, notificationPrefs, userSettings,
      prediction, currentPhase, isLoading,
      updateCycleSettings, saveDayEntry, updateNotificationPrefs,
      updateUserSettings, completeOnboarding,
    }}>
      {children}
    </CycleDataContext.Provider>
  );
}

export function useCycleData() {
  const context = useContext(CycleDataContext);
  if (!context) {
    throw new Error('useCycleData must be used within a CycleDataProvider');
  }
  return context;
}
