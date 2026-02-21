// 💊 Medication Notification Service
import { LocalNotifications, LocalNotificationSchema, ActionPerformed } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { setHours, setMinutes, addDays, isAfter, format } from 'date-fns';
import type { Medication } from '@/types/medication';
import { recordMedicationDose } from '@/lib/medicationStorage';

// Check if we're on a native platform
const isNative = () => Capacitor.isNativePlatform();

// Medication notification channel
export const MEDICATION_NOTIFICATION_CHANNEL = 'medication_reminders';

// ID layout for medication notifications:
// Schedule IDs: BASE + medKey(1000..9999) * 10000 + dayOffset(0..29) * 100 + timeIndex(0..99)
// Snooze IDs:   BASE + 500000 + medHash(0..8999) * 10 + nonce(0..9999 via timestamp)
// Range:        BASE .. BASE + 99_999_999 (all within one band for cancel/pending filter)
const MEDICATION_NOTIFICATION_BASE_ID = 20000;
const MEDICATION_ID_MAX = 99_999_999;

// Register action types for medication notifications
export async function registerMedicationActionTypes(): Promise<void> {
  if (!isNative()) return;
  
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'MEDICATION_ACTIONS',
          actions: [
            {
              id: 'take',
              title: 'Aldım ✓',
              foreground: true,
            },
            {
              id: 'snooze',
              title: '15dk Ertele',
              foreground: false,
            },
          ],
        },
      ],
    });
    console.log('Medication action types registered');
  } catch (error) {
    console.error('Error registering medication action types:', error);
  }
}

// Handle notification action
export async function handleMedicationNotificationAction(action: ActionPerformed): Promise<void> {
  const { actionId, notification } = action;
  const extra = notification.extra;
  
  if (!extra || extra.type !== 'medication_reminder') return;
  
  const medicationId = extra.medicationId;
  const medicationName = extra.medicationName;
  
  if (actionId === 'take') {
    // Record the dose as taken and dismiss the notification
    const today = format(new Date(), 'yyyy-MM-dd');
    await recordMedicationDose(medicationId, today, true);
    if (notification?.id) {
      try { await LocalNotifications.cancel({ notifications: [{ id: notification.id }] }); } catch {}
    }
    console.log(`Medication ${medicationName} marked as taken`);
  } else if (actionId === 'snooze') {
    // Unique snooze ID: medHash * 10000 gives each medication its own 10k nonce block
    const medHash = medicationId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9000;
    const snoozeId = MEDICATION_NOTIFICATION_BASE_ID + 500000 + medHash * 10000 + (Date.now() % 10000);
    const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
    await LocalNotifications.schedule({
      notifications: [{
        id: snoozeId,
        title: `💊 ${medicationName} - Hatırlatma`,
        body: `${extra.scheduledTime} dozunu almayı unutma!`,
        schedule: { at: snoozeTime },
        channelId: MEDICATION_NOTIFICATION_CHANNEL,
        sound: 'notification.wav',
        smallIcon: 'ic_stat_icon',
        actionTypeId: 'MEDICATION_ACTIONS',
        extra: extra,
      }],
    });
    console.log(`Medication ${medicationName} snoozed for 15 minutes (id: ${snoozeId})`);
  }
}

// Create medication notification channel for Android
export async function createMedicationNotificationChannel(): Promise<void> {
  if (!isNative()) return;
  
  try {
    await LocalNotifications.createChannel({
      id: MEDICATION_NOTIFICATION_CHANNEL,
      name: 'İlaç Hatırlatmaları',
      description: 'İlaç dozları için zamanında hatırlatmalar',
      importance: 5, // MAX - will make sound and show heads-up notification
      sound: 'notification.wav',
      visibility: 1, // PUBLIC
      vibration: true,
    });
    console.log('Medication notification channel created');
  } catch (error) {
    console.error('Error creating medication notification channel:', error);
  }
}

// Generate a unique notification ID for a medication at a specific time
// Each medication gets a 10,000 ID block (medKey * 10000): supports 30 days × 100 time slots
function generateNotificationId(medicationId: string, dayOffset: number, timeIndex: number): number {
  const hash = medicationId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const medKey = (hash % 9000) + 1000; // 1000..9999
  return MEDICATION_NOTIFICATION_BASE_ID + medKey * 10000 + dayOffset * 100 + (timeIndex % 100);
}

// Cancel all medication notifications
export async function cancelMedicationNotifications(): Promise<void> {
  if (!isNative()) return;
  
  try {
    const pending = await LocalNotifications.getPending();
    const medicationNotifications = pending.notifications.filter(
      n => n.id >= MEDICATION_NOTIFICATION_BASE_ID && n.id < MEDICATION_NOTIFICATION_BASE_ID + MEDICATION_ID_MAX
    );
    
    if (medicationNotifications.length > 0) {
      await LocalNotifications.cancel({ notifications: medicationNotifications });
      console.log(`Cancelled ${medicationNotifications.length} medication notifications`);
    }
  } catch (error) {
    console.error('Error cancelling medication notifications:', error);
  }
}

// Schedule medication notifications for a single medication
export async function scheduleMedicationNotification(medication: Medication): Promise<void> {
  if (!isNative()) return;
  
  if (!medication.isActive || medication.reminderTimes.length === 0) {
    return;
  }

  const notifications: LocalNotificationSchema[] = [];
  const now = new Date();

  // Schedule notifications for the next 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const targetDate = addDays(now, dayOffset);
    
    medication.reminderTimes.forEach((time, timeIndex) => {
      const [hour, minute] = time.split(':').map(Number);
      const notificationTime = setMinutes(setHours(targetDate, hour), minute);
      
      // Only schedule if in the future
      if (isAfter(notificationTime, now)) {
        const notificationId = generateNotificationId(medication.id, dayOffset, timeIndex);
        
        notifications.push({
          id: notificationId,
          title: `💊 ${medication.name}`,
          body: `${medication.dosage} almayı unutma! (${time})`,
          schedule: { at: notificationTime },
          channelId: MEDICATION_NOTIFICATION_CHANNEL,
          sound: 'notification.wav',
          smallIcon: 'ic_stat_icon',
          actionTypeId: 'MEDICATION_ACTIONS',
          extra: {
            medicationId: medication.id,
            medicationName: medication.name,
            scheduledTime: time,
            type: 'medication_reminder',
          },
        });
      }
    });
  }

  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications });
      console.log(`Scheduled ${notifications.length} notifications for ${medication.name}`);
    } catch (error) {
      console.error(`Error scheduling notifications for ${medication.name}:`, error);
    }
  }
}

// Schedule notifications for all active medications
export async function scheduleMedicationNotifications(medications: Medication[]): Promise<void> {
  if (!isNative()) {
    console.log('Medication notifications not supported on web');
    return;
  }
  
  // First, cancel existing medication notifications
  await cancelMedicationNotifications();
  
  // Create channel if needed
  await createMedicationNotificationChannel();
  
  // Check permissions
  const permResult = await LocalNotifications.checkPermissions();
  if (permResult.display !== 'granted') {
    console.warn('Notification permissions not granted for medications');
    return;
  }
  
  // Schedule notifications for each active medication
  const activeMedications = medications.filter(m => m.isActive);
  
  for (const medication of activeMedications) {
    await scheduleMedicationNotification(medication);
  }
  
  console.log(`Scheduled notifications for ${activeMedications.length} medications`);
}

// Get pending medication notifications (for debug)
export async function getPendingMedicationNotifications(): Promise<LocalNotificationSchema[]> {
  if (!isNative()) return [];
  
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.filter(
      n => n.id >= MEDICATION_NOTIFICATION_BASE_ID && n.id < MEDICATION_NOTIFICATION_BASE_ID + MEDICATION_ID_MAX
    );
  } catch (error) {
    console.error('Error getting pending medication notifications:', error);
    return [];
  }
}

// Schedule a one-time reminder for taking medication (e.g., snooze)
export async function scheduleOneTimeMedicationReminder(
  medication: Medication,
  delayMinutes: number = 15
): Promise<void> {
  if (!isNative()) return;
  
  const notificationTime = new Date(Date.now() + delayMinutes * 60 * 1000);
  
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: MEDICATION_NOTIFICATION_BASE_ID + 500000 + (medication.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 9000) * 10000 + (Date.now() % 10000),
        title: `💊 ${medication.name} - Hatırlatma`,
        body: `${medication.dosage} almayı unutma!`,
        schedule: { at: notificationTime },
        channelId: MEDICATION_NOTIFICATION_CHANNEL,
        sound: 'notification.wav',
        smallIcon: 'ic_stat_icon',
      }],
    });
    console.log(`Scheduled one-time reminder for ${medication.name} in ${delayMinutes} minutes`);
  } catch (error) {
    console.error('Error scheduling one-time reminder:', error);
  }
}

// Test medication notification
export async function sendTestMedicationNotification(): Promise<void> {
  if (!isNative()) {
    throw new Error('Medication notifications not supported on web');
  }
  
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: MEDICATION_NOTIFICATION_BASE_ID + 99998,
        title: '💊 Test İlaç Hatırlatması',
        body: 'İlaç bildirimleri düzgün çalışıyor!',
        schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
        channelId: MEDICATION_NOTIFICATION_CHANNEL,
        sound: 'notification.wav',
        smallIcon: 'ic_stat_icon',
      }],
    });
  } catch (error) {
    console.error('Error sending test medication notification:', error);
    throw error;
  }
}
