// 🌸 Notification Service using Capacitor Local Notifications
import { LocalNotifications, ScheduleOptions, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { parseISO, addDays, setHours, setMinutes, addMinutes, isBefore, isAfter, format } from 'date-fns';
import type { 
  NotificationType, 
  NotificationPreferences, 
  CyclePrediction,
  PrivacyMode,
  NotificationContent 
} from '@/types/cycle';

// Check if we're on a native platform
const isNative = () => Capacitor.isNativePlatform();

// Get current platform
const getPlatform = () => Capacitor.getPlatform();

// Notification channel IDs for Android
export const NOTIFICATION_CHANNELS = {
  CRITICAL: 'critical_cycle_alerts',
  DAILY: 'daily_checkin',
  WELLNESS: 'wellness',
} as const;

// Notification ID ranges (non-overlapping blocks)
// System notifications: 100,000+ (each type gets its own 100,000 block)
// Custom reminders: 50,000 - 99,999
// Test notifications: 40,000 - 49,999
// IMPORTANT: Test ID must ALWAYS remain < 100,000 to avoid being cancelled by cancelScheduledSystemNotifications()
const SYSTEM_NOTIFICATION_ID_BASE = 100000;
const CUSTOM_REMINDER_ID_BASE = 50000;
const CUSTOM_REMINDER_ID_MAX = 99999;
const TEST_NOTIFICATION_ID = 40001; // Safe range: 40,000-49,999

// Notification ID multiplier for each type (100,000 blocks to prevent overlap)
// Each type gets its own 100,000 ID block to guarantee no collisions
const TYPE_ID_MULTIPLIER: Record<NotificationType, number> = {
  period_approaching: 1,
  period_expected: 2,
  period_late: 3,
  fertile_start: 4,
  ovulation_day: 5,
  fertile_ending: 6,
  pms_reminder: 7,
  daily_checkin: 8,
  water_reminder: 9,
  exercise_reminder: 10,
};

// Generate a unique notification ID that won't collide
// Each type has its own 100,000 block (e.g., water: 900000-999999, exercise: 1000000-1099999)
const makeNotificationId = (type: NotificationType, index: number): number => {
  return TYPE_ID_MULTIPLIER[type] * SYSTEM_NOTIFICATION_ID_BASE + index;
};

// Custom reminder ID counter (produces IDs from 50000 to 99999 inclusive)
let customReminderCounter = -1; // Start at -1 so first call produces 50000

const makeCustomReminderId = (): number => {
  // Inclusive range: 50000 to 99999 = 50000 IDs total
  const RANGE = (CUSTOM_REMINDER_ID_MAX - CUSTOM_REMINDER_ID_BASE) + 1;
  customReminderCounter = (customReminderCounter + 1) % RANGE;
  return CUSTOM_REMINDER_ID_BASE + customReminderCounter;
};

// Check if a notification ID is a system notification (not custom)
const isSystemNotificationId = (id: number): boolean => {
  return id >= SYSTEM_NOTIFICATION_ID_BASE;
};

// Get notification content based on type and privacy mode
export function getNotificationContent(
  type: NotificationType,
  language: 'tr' | 'en' = 'tr',
  privacyMode: PrivacyMode = 'partial',
  extraData?: { daysLate?: number }
): { title: string; body: string } {
  const contents: Record<NotificationType, NotificationContent> = {
    period_approaching: {
      title: language === 'tr' ? 'Regl Yaklaşıyor' : 'Period Approaching',
      body: language === 'tr' 
        ? 'Regl dönemin yaklaşık 2 gün içinde başlayabilir.' 
        : 'Your period may start in about 2 days.',
      privateTitle: language === 'tr' ? 'Hatırlatma' : 'Reminder',
      privateBody: language === 'tr' ? 'Döngü güncellemen var.' : 'You have a cycle update.',
    },
    period_expected: {
      title: language === 'tr' ? 'Regl Bugün Bekleniyor' : 'Period Expected Today',
      body: language === 'tr' 
        ? 'Bugün regl dönemin başlayabilir. Hazırlıklı ol!' 
        : 'Your period may start today. Be prepared!',
      privateTitle: language === 'tr' ? 'Günlük Hatırlatma' : 'Daily Reminder',
      privateBody: language === 'tr' ? 'Bugün için bir hatırlatman var.' : 'You have a reminder for today.',
    },
    period_late: {
      title: language === 'tr' ? 'Regl Gecikti' : 'Period Late',
      body: language === 'tr' 
        ? `Regl dönemin ${extraData?.daysLate || 1} gün gecikti.` 
        : `Your period is ${extraData?.daysLate || 1} day(s) late.`,
      privateTitle: language === 'tr' ? 'Hatırlatma' : 'Reminder',
      privateBody: language === 'tr' ? 'Döngü güncellemeni kontrol et.' : 'Check your cycle update.',
    },
    fertile_start: {
      title: language === 'tr' ? 'Doğurgan Dönem Başladı' : 'Fertile Window Started',
      body: language === 'tr' 
        ? 'Yumurtlama dönemin başladı.' 
        : 'Your fertile window has started.',
      privateTitle: language === 'tr' ? 'Döngü Bildirimi' : 'Cycle Notification',
      privateBody: language === 'tr' ? 'Döngü durumun güncellendi.' : 'Your cycle status updated.',
    },
    ovulation_day: {
      title: language === 'tr' ? 'Yumurtlama Günü' : 'Ovulation Day',
      body: language === 'tr' 
        ? 'Bugün tahmini yumurtlama günün.' 
        : 'Today is your estimated ovulation day.',
      privateTitle: language === 'tr' ? 'Döngü Hatırlatması' : 'Cycle Reminder',
      privateBody: language === 'tr' ? 'Önemli bir döngü günü.' : 'Important cycle day.',
    },
    fertile_ending: {
      title: language === 'tr' ? 'Doğurgan Dönem Bitiyor' : 'Fertile Window Ending',
      body: language === 'tr' 
        ? 'Yumurtlama dönemin yarın sona erecek.' 
        : 'Your fertile window ends tomorrow.',
      privateTitle: language === 'tr' ? 'Döngü Bildirimi' : 'Cycle Notification',
      privateBody: language === 'tr' ? 'Döngü durumun güncellendi.' : 'Your cycle status updated.',
    },
    pms_reminder: {
      title: language === 'tr' ? 'PMS Dönemi' : 'PMS Period',
      body: language === 'tr' 
        ? 'PMS semptomları başlayabilir. Kendine iyi bak!' 
        : 'PMS symptoms may begin. Take care of yourself!',
      privateTitle: language === 'tr' ? 'Döngü Hatırlatması' : 'Cycle Reminder',
      privateBody: language === 'tr' ? 'Döngü güncellemen var.' : 'You have a cycle update.',
    },
    daily_checkin: {
      title: language === 'tr' ? 'Günlük Check-in' : 'Daily Check-in',
      body: language === 'tr' 
        ? 'Bugün nasıl hissediyorsun? Durumunu kaydet.' 
        : 'How are you feeling today? Log your status.',
      privateTitle: language === 'tr' ? 'Günlük Hatırlatma' : 'Daily Reminder',
      privateBody: language === 'tr' ? 'Günlük kaydını yap.' : 'Make your daily log.',
    },
    water_reminder: {
      title: language === 'tr' ? 'Su İç 💧' : 'Drink Water 💧',
      body: language === 'tr' 
        ? 'Günlük su hedefin için bir bardak su iç!' 
        : 'Drink a glass of water for your daily goal!',
      privateTitle: language === 'tr' ? 'Su Hatırlatması' : 'Water Reminder',
      privateBody: language === 'tr' ? 'Su içme hatırlatması.' : 'Water intake reminder.',
    },
    exercise_reminder: {
      title: language === 'tr' ? 'Hareket Zamanı 🏃‍♀️' : 'Time to Move 🏃‍♀️',
      body: language === 'tr' 
        ? 'Kısa bir yürüyüş veya esneme yapmaya ne dersin?' 
        : 'How about a short walk or some stretching?',
      privateTitle: language === 'tr' ? 'Egzersiz Hatırlatması' : 'Exercise Reminder',
      privateBody: language === 'tr' ? 'Harekete geçme vakti.' : 'Time to exercise.',
    },
  };

  const content = contents[type];
  
  if (privacyMode === 'full') {
    return { title: content.privateTitle, body: '' };
  } else if (privacyMode === 'partial') {
    return { title: content.privateTitle, body: content.privateBody };
  }
  
  return { title: content.title, body: content.body };
}

// Check if current time is within quiet hours
function isInQuietHours(time: Date, quietStart: string, quietEnd: string): boolean {
  const [startHour, startMin] = quietStart.split(':').map(Number);
  const [endHour, endMin] = quietEnd.split(':').map(Number);
  
  const hour = time.getHours();
  const min = time.getMinutes();
  const currentMinutes = hour * 60 + min;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Get next valid notification time (respects quiet hours correctly)
// FIXED: Overnight quiet hours now correctly handle morning vs night targets
function getNextValidTime(
  targetDate: Date, 
  preferredTime: string, 
  quietStart: string, 
  quietEnd: string
): Date {
  const [prefHour, prefMin] = preferredTime.split(':').map(Number);
  const [startHour, startMin] = quietStart.split(':').map(Number);
  const [endHour, endMin] = quietEnd.split(':').map(Number);
  
  let notificationTime = setMinutes(setHours(targetDate, prefHour), prefMin);
  
  const prefMinutes = prefHour * 60 + prefMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Check if preferred time is in quiet hours
  if (!isInQuietHours(notificationTime, quietStart, quietEnd)) {
    // Not in quiet hours, use as-is
    return notificationTime;
  }
  
  // Preferred time IS in quiet hours - need to reschedule to end of quiet hours
  const isOvernight = startMinutes > endMinutes;
  
  if (isOvernight) {
    // Overnight quiet hours (e.g., 22:00 - 08:00)
    // Two sub-ranges:
    // - Night portion: startMinutes → 24:00 (same day)
    // - Morning portion: 00:00 → endMinutes (same day)
    
    if (prefMinutes >= startMinutes) {
      // Preferred time is in the "night" portion (e.g., 23:00 when quiet is 22:00-08:00)
      // Schedule for end of quiet hours NEXT DAY
      notificationTime = setMinutes(setHours(addDays(targetDate, 1), endHour), endMin);
    } else if (prefMinutes < endMinutes) {
      // Preferred time is in the "morning" portion (e.g., 06:00 when quiet is 22:00-08:00)
      // Schedule for end of quiet hours SAME DAY
      notificationTime = setMinutes(setHours(targetDate, endHour), endMin);
    } else {
      // Fallback for edge cases (e.g., prefMinutes === endMinutes)
      // Schedule for end of quiet hours same day
      notificationTime = setMinutes(setHours(targetDate, endHour), endMin);
    }
  } else {
    // Normal quiet hours (e.g., 14:00 - 16:00)
    // Just schedule for end time same day
    notificationTime = setMinutes(setHours(targetDate, endHour), endMin);
  }
  
  return notificationTime;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNative()) {
    console.log('Notifications not supported on web');
    return false;
  }
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Check current permission status
export async function checkNotificationPermissions(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

// Cancel ALL notifications (use with caution - deletes custom reminders too)
export async function cancelAllNotifications(): Promise<void> {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}

// Cancel only SYSTEM notifications (preserves custom reminders in 50000-99999 range)
export async function cancelScheduledSystemNotifications(): Promise<void> {
  if (!isNative()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const systemNotifications = pending.notifications.filter(n => isSystemNotificationId(n.id));
    
    if (systemNotifications.length > 0) {
      await LocalNotifications.cancel({ notifications: systemNotifications });
      console.log(`🗑️ Cancelled ${systemNotifications.length} system notifications (preserved custom reminders)`);
    }
  } catch (error) {
    console.error('Error cancelling system notifications:', error);
  }
}

// Build platform-specific notification payload
function buildNotificationPayload(
  id: number,
  title: string,
  body: string,
  scheduleAt: Date,
  channelId: string
): LocalNotificationSchema {
  const platform = getPlatform();
  
  const basePayload: LocalNotificationSchema = {
    id,
    title,
    body,
    schedule: { at: scheduleAt },
  };
  
  if (platform === 'android') {
    // Android-specific: channelId, smallIcon, sound
    return {
      ...basePayload,
      channelId,
      smallIcon: 'ic_stat_icon',
      sound: 'notification.wav',
    };
  } else if (platform === 'ios') {
    // iOS-specific: no channelId or smallIcon, optional sound
    return {
      ...basePayload,
      sound: 'notification.wav',
    };
  }
  
  // Fallback for unknown platforms
  return basePayload;
}

// Scheduling mutex to prevent concurrent scheduling
let isScheduling = false;
let pendingScheduleArgs: { prediction: CyclePrediction; prefs: NotificationPreferences; language: 'tr' | 'en' } | null = null;
let scheduleDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced wrapper - coalesces rapid calls into one
export function scheduleNotifications(
  prediction: CyclePrediction,
  prefs: NotificationPreferences,
  language: 'tr' | 'en' = 'tr'
): Promise<{ scheduled: number; errors: string[] }> {
  return new Promise((resolve) => {
    pendingScheduleArgs = { prediction, prefs, language };
    
    if (scheduleDebounceTimer) {
      clearTimeout(scheduleDebounceTimer);
    }
    
    scheduleDebounceTimer = setTimeout(async () => {
      const args = pendingScheduleArgs;
      pendingScheduleArgs = null;
      scheduleDebounceTimer = null;
      
      if (!args) {
        resolve({ scheduled: 0, errors: [] });
        return;
      }
      
      // Wait for any in-progress scheduling to finish
      while (isScheduling) {
        await new Promise(r => setTimeout(r, 100));
      }
      
      const result = await _doScheduleNotifications(args.prediction, args.prefs, args.language);
      resolve(result);
    }, 500); // 500ms debounce - coalesces rapid calls
  });
}

// Internal: actual scheduling logic (called only from debounced wrapper)
async function _doScheduleNotifications(
  prediction: CyclePrediction,
  prefs: NotificationPreferences,
  language: 'tr' | 'en' = 'tr'
): Promise<{ scheduled: number; errors: string[] }> {
  const result = { scheduled: 0, errors: [] as string[] };
  
  if (isScheduling) {
    console.log('⏳ Notification scheduling already in progress, skipping');
    return result;
  }
  
  isScheduling = true;
  console.log('🔔 scheduleNotifications executing', new Date().toISOString(), new Error().stack);
  
  try {
  if (!isNative()) {
    result.errors.push('Web platform - not supported');
    return result;
  }
  
  if (!prefs.enabled) {
    await cancelScheduledSystemNotifications();
    return result;
  }
  
  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    result.errors.push('Permission not granted');
    return result;
  }
  
  if (getPlatform() === 'android') {
    try {
      await createNotificationChannels();
    } catch (error) {
      result.errors.push(`Channel creation failed: ${error}`);
      return result;
    }
  }
  
  // Cancel existing SYSTEM notifications before rescheduling
  await cancelScheduledSystemNotifications();
  
  // Small delay to ensure cancellation is processed
  await new Promise(r => setTimeout(r, 800));
  
  const notifications: LocalNotificationSchema[] = [];
  const now = new Date();
  
  const seqByType: Record<string, number> = {};
  const nextIndex = (type: NotificationType): number => {
    seqByType[type] = (seqByType[type] ?? 0) + 1;
    return seqByType[type];
  };
  
  const getChannelForType = (type: NotificationType): string => {
    if (type === 'daily_checkin') return NOTIFICATION_CHANNELS.DAILY;
    if (type === 'water_reminder' || type === 'exercise_reminder') return NOTIFICATION_CHANNELS.WELLNESS;
    return NOTIFICATION_CHANNELS.CRITICAL;
  };
  
  // Avoid Android bundling: ensure each notification occupies a unique MINUTE slot
  const minuteKey = (d: Date) => {
    const copy = new Date(d);
    copy.setSeconds(0, 0);
    return copy.getTime();
  };
  
  const ensureNonOverlappingTime = (desired: Date): Date => {
    let t = new Date(desired);
    t.setSeconds(5);
    t.setMilliseconds(0);
    
    const hasMinuteCollision = (keyMs: number) =>
      notifications.some(n => {
        const at = n.schedule?.at instanceof Date ? n.schedule.at : null;
        if (!at) return false;
        return minuteKey(at) === keyMs;
      });
    
    while (hasMinuteCollision(minuteKey(t))) {
      t = addMinutes(t, 1);
      t.setSeconds(5);
      t.setMilliseconds(0);
    }
    
    return t;
  };
  
  // Helper to add notification - each type gets a small minute offset to prevent stacking
  const TYPE_MINUTE_OFFSET: Record<NotificationType, number> = {
    period_approaching: 0,
    period_expected: 1,
    period_late: 2,
    fertile_start: 3,
    ovulation_day: 4,
    fertile_ending: 5,
    pms_reminder: 6,
    daily_checkin: 7,
    water_reminder: 0,    // water/exercise use fixed times, not preferredTime
    exercise_reminder: 0,
  };
  
  const addNotification = (
    type: NotificationType,
    targetDate: Date,
    extraData?: { daysLate?: number }
  ) => {
    if (!prefs.togglesByType[type]) return;
    
    let scheduleTime = getNextValidTime(
      targetDate,
      prefs.preferredTime,
      prefs.quietHoursStart,
      prefs.quietHoursEnd
    );
    
    // Add minute offset to prevent simultaneous notifications
    const offset = TYPE_MINUTE_OFFSET[type];
    if (offset > 0) {
      scheduleTime = addMinutes(scheduleTime, offset);
    }
    
    if (isBefore(scheduleTime, now)) return;
    
    // Ensure no collision with already-scheduled notifications
    scheduleTime = ensureNonOverlappingTime(scheduleTime);
    
    // Deduplicate: same type + same minute => skip
    const targetMinuteMs = minuteKey(scheduleTime);
    const existsSameTypeSameMinute = notifications.some(n => {
      if (n.id == null) return false;
      const nAt = n.schedule?.at instanceof Date ? n.schedule.at : null;
      if (!nAt) return false;
      const isSameMinute = minuteKey(nAt) === targetMinuteMs;
      const isSameTypeBlock = Math.floor(n.id / SYSTEM_NOTIFICATION_ID_BASE) === TYPE_ID_MULTIPLIER[type];
      return isSameMinute && isSameTypeBlock;
    });
    if (existsSameTypeSameMinute) return;
    
    const content = getNotificationContent(type, language, prefs.privacyMode, extraData);
    const channelId = getChannelForType(type);
    
    notifications.push(
      buildNotificationPayload(
        makeNotificationId(type, nextIndex(type)),
        content.title,
        content.body,
        scheduleTime,
        channelId
      )
    );
  };
  
  // Schedule cycle-specific notifications (one-time events)
  const periodApproachingDate = addDays(parseISO(prediction.nextPeriodStart), -2);
  addNotification('period_approaching', periodApproachingDate);
  
  const periodExpectedDate = parseISO(prediction.nextPeriodStart);
  addNotification('period_expected', periodExpectedDate);
  
  for (let daysLate = 1; daysLate <= 3; daysLate++) {
    const periodLateDate = addDays(parseISO(prediction.nextPeriodStart), daysLate);
    addNotification('period_late', periodLateDate, { daysLate });
  }
  
  const fertileStartDate = parseISO(prediction.fertileWindowStart);
  addNotification('fertile_start', fertileStartDate);
  
  const ovulationDate = parseISO(prediction.ovulationDate);
  addNotification('ovulation_day', ovulationDate);
  
  const fertileEndingDate = addDays(parseISO(prediction.fertileWindowEnd), -1);
  addNotification('fertile_ending', fertileEndingDate);
  
  const pmsDate = parseISO(prediction.pmsStart);
  addNotification('pms_reminder', pmsDate);
  
  // Daily check-ins: 1 per day for 30 days
  if (prefs.togglesByType.daily_checkin) {
    for (let i = 0; i <= 30; i++) {
      const checkInDate = addDays(now, i);
      addNotification('daily_checkin', checkInDate);
    }
  }
  
  // Water reminders: 3 per day at 10:00, 14:00, 18:00
  if (prefs.togglesByType.water_reminder) {
    for (let i = 0; i <= 30; i++) {
      const baseDate = addDays(now, i);
      [10, 14, 18].forEach((hour, slotIndex) => {
        let waterTime = setMinutes(setHours(baseDate, hour), 0);
        waterTime = getNextValidTime(waterTime, format(waterTime, 'HH:mm'), prefs.quietHoursStart, prefs.quietHoursEnd);
        if (isAfter(waterTime, now)) {
          waterTime = ensureNonOverlappingTime(waterTime);
          // Dedup: same type + same minute => skip
          const waterMinuteMs = minuteKey(waterTime);
          const alreadyWaterAtMinute = notifications.some(n => {
            const at = n.schedule?.at instanceof Date ? n.schedule.at : null;
            if (!at) return false;
            return minuteKey(at) === waterMinuteMs && Math.floor((n.id ?? 0) / SYSTEM_NOTIFICATION_ID_BASE) === TYPE_ID_MULTIPLIER.water_reminder;
          });
          if (alreadyWaterAtMinute) return;
          const content = getNotificationContent('water_reminder', language, prefs.privacyMode);
          const idx = i * 10 + slotIndex;
          notifications.push(
            buildNotificationPayload(makeNotificationId('water_reminder', idx), content.title, content.body, waterTime, NOTIFICATION_CHANNELS.WELLNESS)
          );
        }
      });
    }
  }
  
  // Exercise reminders: 1 per day at 17:00
  if (prefs.togglesByType.exercise_reminder) {
    for (let i = 0; i <= 30; i++) {
      let exerciseDate = setMinutes(setHours(addDays(now, i), 17), 0);
      exerciseDate = getNextValidTime(exerciseDate, format(exerciseDate, 'HH:mm'), prefs.quietHoursStart, prefs.quietHoursEnd);

      if (!isAfter(exerciseDate, now)) continue;

      exerciseDate = ensureNonOverlappingTime(exerciseDate);

      const exMinuteMs = minuteKey(exerciseDate);
      const alreadyExAtMinute = notifications.some(n => {
        const at = n.schedule?.at instanceof Date ? n.schedule.at : null;
        if (!at) return false;
        return minuteKey(at) === exMinuteMs && Math.floor((n.id ?? 0) / SYSTEM_NOTIFICATION_ID_BASE) === TYPE_ID_MULTIPLIER.exercise_reminder;
      });

      if (alreadyExAtMinute) continue;

      const content = getNotificationContent('exercise_reminder', language, prefs.privacyMode);
      notifications.push(
        buildNotificationPayload(makeNotificationId('exercise_reminder', i), content.title, content.body, exerciseDate, NOTIFICATION_CHANNELS.WELLNESS)
      );
    }
  }
  
  // Schedule all at once
  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
      result.scheduled = notifications.length;
      console.log(`✅ Scheduled ${notifications.length} total notifications (deduplicated)`);
      
      const waterNotifs = notifications.filter(n => n.id >= 900000 && n.id < 1000000);
      const exerciseNotifs = notifications.filter(n => n.id >= 1000000 && n.id < 1100000);
      const checkInNotifs = notifications.filter(n => n.id >= 800000 && n.id < 900000);
      const cycleNotifs = notifications.filter(n => n.id >= 100000 && n.id < 800000);
      
      console.log(`🌸 Cycle: ${cycleNotifs.length} | 📝 Check-in: ${checkInNotifs.length} | 💧 Water: ${waterNotifs.length} | 🏃 Exercise: ${exerciseNotifs.length}`);
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
      result.errors.push(`Scheduling failed: ${error}`);
    }
  }
  
  return result;
  } finally {
    isScheduling = false;
  }
}

// Get list of pending notifications (for debug panel)
export async function getPendingNotifications(): Promise<LocalNotificationSchema[]> {
  if (!isNative()) return [];
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications;
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

// Send a test notification immediately
export async function sendTestNotification(language: 'tr' | 'en' = 'tr'): Promise<void> {
  if (!isNative()) {
    throw new Error('Notifications not supported on web');
  }
  
  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }
  
  const platform = getPlatform();
  
  const notification: LocalNotificationSchema = {
    id: TEST_NOTIFICATION_ID, // Safe ID outside custom reminder range
    title: language === 'tr' ? 'Test Bildirimi' : 'Test Notification',
    body: language === 'tr' 
      ? 'Bildirimler düzgün çalışıyor! 🌸' 
      : 'Notifications are working correctly! 🌸',
    schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
  };
  
  // Add platform-specific properties
  if (platform === 'android') {
    notification.channelId = NOTIFICATION_CHANNELS.CRITICAL;
    notification.smallIcon = 'ic_stat_icon';
    notification.sound = 'notification.wav';
  } else if (platform === 'ios') {
    notification.sound = 'notification.wav';
  }
  
  await LocalNotifications.schedule({ notifications: [notification] });
}

// Create notification channels for Android ONLY
export async function createNotificationChannels(): Promise<void> {
  // Channels are Android-only concept
  if (!isNative() || getPlatform() !== 'android') {
    return;
  }
  
  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNELS.CRITICAL,
      name: 'Kritik Döngü Uyarıları',
      description: 'Regl, yumurtlama ve önemli döngü bildirimleri',
      importance: 4, // HIGH
      sound: 'notification.wav',
      visibility: 1, // PUBLIC
      vibration: true,
    });
    
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNELS.DAILY,
      name: 'Günlük Check-in',
      description: 'Günlük semptom ve ruh hali kaydı hatırlatmaları',
      importance: 3, // DEFAULT
      sound: 'notification.wav',
      visibility: 0, // PRIVATE
      vibration: true,
    });
    
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNELS.WELLNESS,
      name: 'Wellness',
      description: 'Su iç, egzersiz gibi wellness hatırlatmaları',
      importance: 3, // DEFAULT
      sound: 'notification.wav',
      visibility: 0, // PRIVATE
      vibration: true,
    });
    
    console.log('✅ Android notification channels created');
  } catch (error) {
    console.error('Error creating notification channels:', error);
    throw error;
  }
}

// Schedule a custom reminder for a specific date
export async function scheduleCustomReminder(
  title: string,
  body: string,
  targetDate: Date,
  language: 'tr' | 'en' = 'tr'
): Promise<boolean> {
  if (!isNative()) {
    console.log('Custom reminders not supported on web');
    return false;
  }
  
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.warn('Notification permissions not granted for custom reminder');
        return false;
      }
    }
    
    // Ensure channels exist before scheduling (Android only)
    await createNotificationChannels();
    
    // Schedule for 9:00:05 AM on the target date (seconds stabilized)
    const scheduleTime = setMinutes(setHours(targetDate, 9), 0);
    scheduleTime.setSeconds(5, 0);
    
    // Only schedule if in the future
    if (isBefore(scheduleTime, new Date())) {
      console.warn('Cannot schedule reminder for past date');
      return false;
    }
    
    const notificationId = makeCustomReminderId();
    const platform = getPlatform();
    
    const notification: LocalNotificationSchema = {
      id: notificationId,
      title,
      body,
      schedule: { at: scheduleTime },
    };
    
    // Add platform-specific properties
    if (platform === 'android') {
      notification.channelId = NOTIFICATION_CHANNELS.CRITICAL;
      notification.smallIcon = 'ic_stat_icon';
      notification.sound = 'notification.wav';
    } else if (platform === 'ios') {
      notification.sound = 'notification.wav';
    }
    
    await LocalNotifications.schedule({ notifications: [notification] });
    
    console.log(`✅ Scheduled custom reminder #${notificationId} for ${format(scheduleTime, 'yyyy-MM-dd HH:mm')}`);
    return true;
  } catch (error) {
    console.error('❌ Error scheduling custom reminder:', error);
    return false;
  }
}

// Verify and diagnose notification system
export async function diagnoseNotifications(): Promise<{
  isNative: boolean;
  platform: string;
  hasPermission: boolean;
  pendingCount: number;
  systemCount: number;
  customCount: number;
  channelsCreated: boolean;
  channelsApplicable: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let hasPermission = false;
  let pendingCount = 0;
  let systemCount = 0;
  let customCount = 0;
  let channelsCreated = false;
  const platform = getPlatform();
  const channelsApplicable = platform === 'android';

  if (!isNative()) {
    return {
      isNative: false,
      platform: 'web',
      hasPermission: false,
      pendingCount: 0,
      systemCount: 0,
      customCount: 0,
      channelsCreated: false,
      channelsApplicable: false,
      errors: ['Web platform - notifications not supported'],
    };
  }

  try {
    hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      errors.push('Notification permission not granted');
    }
  } catch (e) {
    errors.push(`Permission check failed: ${e}`);
  }

  try {
    const pending = await LocalNotifications.getPending();
    pendingCount = pending.notifications.length;
    systemCount = pending.notifications.filter(n => isSystemNotificationId(n.id)).length;
    customCount = pending.notifications.filter(n => n.id >= CUSTOM_REMINDER_ID_BASE && n.id <= CUSTOM_REMINDER_ID_MAX).length;
  } catch (e) {
    errors.push(`Failed to get pending notifications: ${e}`);
  }

  if (channelsApplicable) {
    try {
      await createNotificationChannels();
      channelsCreated = true;
    } catch (e) {
      errors.push(`Channel creation failed: ${e}`);
    }
  } else {
    // On iOS, channels don't apply - mark as "created" for diagnostic purposes
    channelsCreated = true;
  }

  return {
    isNative: true,
    platform,
    hasPermission,
    pendingCount,
    systemCount,
    customCount,
    channelsCreated,
    channelsApplicable,
    errors,
  };
}
