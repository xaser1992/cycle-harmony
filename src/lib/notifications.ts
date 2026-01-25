// 🌸 Notification Service using Capacitor Local Notifications
import { LocalNotifications, ScheduleOptions, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { parseISO, addDays, setHours, setMinutes, isBefore, isAfter, format } from 'date-fns';
import type { 
  NotificationType, 
  NotificationPreferences, 
  CyclePrediction,
  PrivacyMode,
  NotificationContent 
} from '@/types/cycle';

// Check if we're on a native platform
const isNative = () => Capacitor.isNativePlatform();

// Notification channel IDs for Android
export const NOTIFICATION_CHANNELS = {
  CRITICAL: 'critical_cycle_alerts',
  DAILY: 'daily_checkin',
  WELLNESS: 'wellness',
} as const;

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
  return TYPE_ID_MULTIPLIER[type] * 100000 + index;
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
      privateTitle: language === 'tr' ? 'Wellness Hatırlatması' : 'Wellness Reminder',
      privateBody: language === 'tr' ? 'Kendine iyi bak.' : 'Take care of yourself.',
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
      privateTitle: language === 'tr' ? 'Wellness' : 'Wellness',
      privateBody: language === 'tr' ? 'Wellness hatırlatması.' : 'Wellness reminder.',
    },
    exercise_reminder: {
      title: language === 'tr' ? 'Hareket Zamanı 🏃‍♀️' : 'Time to Move 🏃‍♀️',
      body: language === 'tr' 
        ? 'Kısa bir yürüyüş veya esneme yapmaya ne dersin?' 
        : 'How about a short walk or some stretching?',
      privateTitle: language === 'tr' ? 'Wellness' : 'Wellness',
      privateBody: language === 'tr' ? 'Wellness hatırlatması.' : 'Wellness reminder.',
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

// Get next valid notification time
function getNextValidTime(
  targetDate: Date, 
  preferredTime: string, 
  quietStart: string, 
  quietEnd: string
): Date {
  const [hour, min] = preferredTime.split(':').map(Number);
  let notificationTime = setMinutes(setHours(targetDate, hour), min);
  
  // If preferred time is in quiet hours, schedule for end of quiet hours
  if (isInQuietHours(notificationTime, quietStart, quietEnd)) {
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    notificationTime = setMinutes(setHours(targetDate, endHour), endMin);
    
    // If end time is before start (overnight), add a day
    if (endHour < parseInt(quietStart.split(':')[0])) {
      notificationTime = addDays(notificationTime, 1);
    }
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

// Cancel all scheduled notifications
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

// Schedule all notifications based on predictions
export async function scheduleNotifications(
  prediction: CyclePrediction,
  prefs: NotificationPreferences,
  language: 'tr' | 'en' = 'tr'
): Promise<void> {
  if (!isNative()) {
    console.log('Notifications not supported on web');
    return;
  }
  
  if (!prefs.enabled) {
    await cancelAllNotifications();
    return;
  }
  
  const hasPermission = await checkNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permissions not granted');
    return;
  }
  
  // Ensure notification channels exist before scheduling (critical for Android)
  await createNotificationChannels();
  
  // Cancel existing notifications before rescheduling
  await cancelAllNotifications();
  
  const notifications: LocalNotificationSchema[] = [];
  const now = new Date();
  
  // Track sequence index per notification type
  const seqByType: Record<string, number> = {};
  const nextIndex = (type: NotificationType): number => {
    seqByType[type] = (seqByType[type] ?? 0) + 1;
    return seqByType[type];
  };
  
  // Helper to add notification if enabled and in future
  const addNotification = (
    type: NotificationType,
    targetDate: Date,
    extraData?: { daysLate?: number }
  ) => {
    if (!prefs.togglesByType[type]) return;
    
    const scheduleTime = getNextValidTime(
      targetDate,
      prefs.preferredTime,
      prefs.quietHoursStart,
      prefs.quietHoursEnd
    );
    
    // Only schedule if in the future
    if (isBefore(scheduleTime, now)) return;
    
    const content = getNotificationContent(type, language, prefs.privacyMode, extraData);
    
    notifications.push({
      id: makeNotificationId(type, nextIndex(type)),
      title: content.title,
      body: content.body,
      schedule: { at: scheduleTime },
      channelId: type === 'daily_checkin' ? NOTIFICATION_CHANNELS.DAILY : NOTIFICATION_CHANNELS.CRITICAL,
      sound: 'notification.wav',
      smallIcon: 'ic_stat_icon',
    });
  };
  
  // Schedule period approaching (2 days before)
  const periodApproachingDate = addDays(parseISO(prediction.nextPeriodStart), -2);
  addNotification('period_approaching', periodApproachingDate);
  
  // Schedule period expected (on the day)
  const periodExpectedDate = parseISO(prediction.nextPeriodStart);
  addNotification('period_expected', periodExpectedDate);
  
  // Schedule period late (1 day after expected)
  const periodLateDate = addDays(parseISO(prediction.nextPeriodStart), 1);
  addNotification('period_late', periodLateDate, { daysLate: 1 });
  
  // Schedule fertile window start
  const fertileStartDate = parseISO(prediction.fertileWindowStart);
  addNotification('fertile_start', fertileStartDate);
  
  // Schedule ovulation day
  const ovulationDate = parseISO(prediction.ovulationDate);
  addNotification('ovulation_day', ovulationDate);
  
  // Schedule fertile window ending (1 day before end)
  const fertileEndingDate = addDays(parseISO(prediction.fertileWindowEnd), -1);
  addNotification('fertile_ending', fertileEndingDate);
  
  // Schedule PMS reminder
  const pmsDate = parseISO(prediction.pmsStart);
  addNotification('pms_reminder', pmsDate);
  
  // Schedule daily check-ins for next 30 days
  // IMPORTANT: Start from i=0 (today) to include today's check-in if time hasn't passed
  if (prefs.togglesByType.daily_checkin) {
    for (let i = 0; i <= 30; i++) {
      const checkInDate = addDays(now, i);
      addNotification('daily_checkin', checkInDate);
    }
  }
  
  // Schedule water reminders for next 30 days (3 times per day: 10:00, 14:00, 18:00)
  // IMPORTANT: Start from i=0 (today) to include today's remaining reminders
  if (prefs.togglesByType.water_reminder) {
    for (let i = 0; i <= 30; i++) {
      const baseDate = addDays(now, i);
      [10, 14, 18].forEach((hour, slotIndex) => {
        const waterTime = setMinutes(setHours(baseDate, hour), 0);
        // Only schedule if in the future AND not in quiet hours
        if (isAfter(waterTime, now) && !isInQuietHours(waterTime, prefs.quietHoursStart, prefs.quietHoursEnd)) {
          const content = getNotificationContent('water_reminder', language, prefs.privacyMode);
          // Use day*10 + slotIndex for unique index within water type
          const idx = i * 10 + slotIndex;
          notifications.push({
            id: makeNotificationId('water_reminder', idx),
            title: content.title,
            body: content.body,
            schedule: { at: waterTime },
            channelId: NOTIFICATION_CHANNELS.WELLNESS,
            smallIcon: 'ic_stat_icon',
            sound: 'notification.wav',
          });
        }
      });
    }
  }
  
  // Schedule exercise reminders for next 30 days (once per day at 17:00)
  // IMPORTANT: Start from i=0 (today) to include today's reminder if not passed
  if (prefs.togglesByType.exercise_reminder) {
    for (let i = 0; i <= 30; i++) {
      const exerciseDate = setMinutes(setHours(addDays(now, i), 17), 0);
      // Only schedule if in the future AND not in quiet hours
      if (isAfter(exerciseDate, now) && !isInQuietHours(exerciseDate, prefs.quietHoursStart, prefs.quietHoursEnd)) {
        const content = getNotificationContent('exercise_reminder', language, prefs.privacyMode);
        notifications.push({
          id: makeNotificationId('exercise_reminder', i),
          title: content.title,
          body: content.body,
          schedule: { at: exerciseDate },
          channelId: NOTIFICATION_CHANNELS.WELLNESS,
          smallIcon: 'ic_stat_icon',
          sound: 'notification.wav',
        });
      }
    }
  }
  
  // Schedule all notifications
  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
      console.log(`✅ Scheduled ${notifications.length} total notifications`);
      
      // Detailed breakdown by type (using 100,000 block ranges)
      const waterNotifs = notifications.filter(n => n.id >= 900000 && n.id < 1000000);
      const exerciseNotifs = notifications.filter(n => n.id >= 1000000 && n.id < 1100000);
      const checkInNotifs = notifications.filter(n => n.id >= 800000 && n.id < 900000);
      
      console.log(`💧 Water reminders: ${waterNotifs.length}`);
      console.log(`🏃 Exercise reminders: ${exerciseNotifs.length}`);
      console.log(`📝 Daily check-ins: ${checkInNotifs.length}`);
      
      if (waterNotifs.length > 0) {
        console.log(`💧 First water at: ${waterNotifs[0].schedule?.at}`);
      }
      if (exerciseNotifs.length > 0) {
        console.log(`🏃 First exercise at: ${exerciseNotifs[0].schedule?.at}`);
      }
      if (checkInNotifs.length > 0) {
        console.log(`📝 First check-in at: ${checkInNotifs[0].schedule?.at}`);
      }
    } catch (error) {
      console.error('❌ Error scheduling notifications:', error);
    }
  } else {
    console.warn('⚠️ No notifications to schedule');
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
  
  await LocalNotifications.schedule({
    notifications: [{
      id: 99999,
      title: language === 'tr' ? 'Test Bildirimi' : 'Test Notification',
      body: language === 'tr' 
        ? 'Bildirimler düzgün çalışıyor! 🌸' 
        : 'Notifications are working correctly! 🌸',
      schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
      sound: 'notification.wav',
      smallIcon: 'ic_stat_icon',
    }],
  });
}

// Create notification channels for Android
export async function createNotificationChannels(): Promise<void> {
  if (!isNative()) return;
  
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
      importance: 3, // DEFAULT - was LOW(2), now higher for visibility
      sound: 'notification.wav', // Added sound
      visibility: 0, // PRIVATE
      vibration: true, // Added vibration
    });
    
    console.log('Notification channels created');
  } catch (error) {
    console.error('Error creating notification channels:', error);
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
        return false;
      }
    }
    
    // Schedule for 9:00 AM on the target date
    const scheduleTime = setMinutes(setHours(targetDate, 9), 0);
    
    // Only schedule if in the future
    if (isBefore(scheduleTime, new Date())) {
      console.warn('Cannot schedule reminder for past date');
      return false;
    }
    
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 100000) + 20000,
        title,
        body,
        schedule: { at: scheduleTime },
        channelId: NOTIFICATION_CHANNELS.CRITICAL,
        sound: 'notification.wav',
        smallIcon: 'ic_stat_icon',
      }],
    });
    
    console.log(`Scheduled custom reminder for ${format(scheduleTime, 'yyyy-MM-dd HH:mm')}`);
    return true;
  } catch (error) {
    console.error('Error scheduling custom reminder:', error);
    return false;
  }
}
