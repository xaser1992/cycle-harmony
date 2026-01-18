// 🌸 Local Storage Service using Capacitor Preferences
import { Preferences } from '@capacitor/preferences';
import type { 
  CycleSettings, 
  DayEntry, 
  NotificationPreferences, 
  UserSettings,
  DEFAULT_CYCLE_SETTINGS,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_USER_SETTINGS 
} from '@/types/cycle';

const STORAGE_KEYS = {
  CYCLE_SETTINGS: 'cycle_settings',
  DAY_ENTRIES: 'day_entries',
  NOTIFICATION_PREFS: 'notification_prefs',
  USER_SETTINGS: 'user_settings',
  CYCLE_HISTORY: 'cycle_history',
} as const;

// Generic get/set functions
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await Preferences.remove({ key });
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
  }
}

// Cycle Settings
export async function getCycleSettings(): Promise<CycleSettings | null> {
  return getItem<CycleSettings>(STORAGE_KEYS.CYCLE_SETTINGS);
}

export async function saveCycleSettings(settings: CycleSettings): Promise<void> {
  return setItem(STORAGE_KEYS.CYCLE_SETTINGS, settings);
}

// Day Entries
export async function getDayEntries(): Promise<DayEntry[]> {
  const entries = await getItem<DayEntry[]>(STORAGE_KEYS.DAY_ENTRIES);
  return entries || [];
}

export async function saveDayEntry(entry: DayEntry): Promise<void> {
  const entries = await getDayEntries();
  const existingIndex = entries.findIndex(e => e.date === entry.date);
  
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  
  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return setItem(STORAGE_KEYS.DAY_ENTRIES, entries);
}

export async function getDayEntry(date: string): Promise<DayEntry | null> {
  const entries = await getDayEntries();
  return entries.find(e => e.date === date) || null;
}

export async function deleteDayEntry(date: string): Promise<void> {
  const entries = await getDayEntries();
  const filtered = entries.filter(e => e.date !== date);
  return setItem(STORAGE_KEYS.DAY_ENTRIES, filtered);
}

// Notification Preferences
export async function getNotificationPrefs(): Promise<NotificationPreferences | null> {
  return getItem<NotificationPreferences>(STORAGE_KEYS.NOTIFICATION_PREFS);
}

export async function saveNotificationPrefs(prefs: NotificationPreferences): Promise<void> {
  return setItem(STORAGE_KEYS.NOTIFICATION_PREFS, prefs);
}

// User Settings
export async function getUserSettings(): Promise<UserSettings | null> {
  return getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  return setItem(STORAGE_KEYS.USER_SETTINGS, settings);
}

// Cycle History (for tracking past periods for better predictions)
export interface CycleRecord {
  startDate: string;
  endDate: string;
  length: number;
}

export async function getCycleHistory(): Promise<CycleRecord[]> {
  const history = await getItem<CycleRecord[]>(STORAGE_KEYS.CYCLE_HISTORY);
  return history || [];
}

export async function addCycleRecord(record: CycleRecord): Promise<void> {
  const history = await getCycleHistory();
  history.push(record);
  // Keep last 12 cycles for averaging
  const trimmed = history.slice(-12);
  return setItem(STORAGE_KEYS.CYCLE_HISTORY, trimmed);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await Promise.all([
    removeItem(STORAGE_KEYS.CYCLE_SETTINGS),
    removeItem(STORAGE_KEYS.DAY_ENTRIES),
    removeItem(STORAGE_KEYS.NOTIFICATION_PREFS),
    removeItem(STORAGE_KEYS.USER_SETTINGS),
    removeItem(STORAGE_KEYS.CYCLE_HISTORY),
  ]);
}

// Export data as JSON
export async function exportData(): Promise<string> {
  const [cycleSettings, dayEntries, notificationPrefs, userSettings, cycleHistory] = await Promise.all([
    getCycleSettings(),
    getDayEntries(),
    getNotificationPrefs(),
    getUserSettings(),
    getCycleHistory(),
  ]);

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    cycleSettings,
    dayEntries,
    notificationPrefs,
    userSettings,
    cycleHistory,
  }, null, 2);
}

// Import data from JSON
export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    
    await Promise.all([
      data.cycleSettings && saveCycleSettings(data.cycleSettings),
      data.dayEntries && setItem(STORAGE_KEYS.DAY_ENTRIES, data.dayEntries),
      data.notificationPrefs && saveNotificationPrefs(data.notificationPrefs),
      data.userSettings && saveUserSettings(data.userSettings),
      data.cycleHistory && setItem(STORAGE_KEYS.CYCLE_HISTORY, data.cycleHistory),
    ]);
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}
