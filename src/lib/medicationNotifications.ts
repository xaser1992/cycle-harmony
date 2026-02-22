// 💊 Medication Notification Service
import {
  LocalNotifications,
  LocalNotificationSchema,
  ActionPerformed,
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { setHours, setMinutes, addDays, isAfter, format } from 'date-fns';
import type { Medication } from '@/types/medication';
import { toggleMedicationLog } from '@/lib/medicationStorage';

// Check if we're on a native platform
const isNative = () => Capacitor.isNativePlatform();

// Medication notification channel
export const MEDICATION_NOTIFICATION_CHANNEL = 'medication_reminders';

// ID layout for medication notifications (20M–120M band):
// Schedule IDs: BASE + medKey(1000..8999) * 10000 + dayOffset(0..29) * 100 + timeIndex(0..7)
//   → range: BASE + 10,000,000 .. BASE + 89,992,907
// Snooze IDs:   BASE + SNOOZE_OFFSET + medHash(0..999) * 10000 + nonce(0..9999)
//   → range: BASE + 90,000,000 .. BASE + 99,999,999
// Cancel range: BASE .. BASE + MEDICATION_ID_MAX
const MEDICATION_NOTIFICATION_BASE_ID = 20_000_000;
const MEDICATION_ID_MAX = 100_000_000;
const SNOOZE_OFFSET = 90_000_000;

const SCHEDULE_MEDKEY_MOD = 8000; // medKey: 1000..8999
const SNOOZE_MEDHASH_MOD = 1000;  // medHash: 0..999  (band-safe: 90,000,000..99,999,999)

// Monotonic counter for snooze nonce to avoid same-ms collisions
let _snoozeSeq = 0;

/**
 * Prefer deriving a stable-ish numeric key from our medication id.
 * Your ids are like `med_${Date.now()}` so this massively reduces collisions vs char-sum hashing.
 */
function medKeyFromId(medicationId: string): number {
  const m = medicationId.match(/\d+/g);
  const digits = m ? m.join('') : '';
  const tail = digits ? digits.slice(-9) : ''; // keep it in JS safe range
  const num = tail ? parseInt(tail, 10) : 0;
  return (num % SCHEDULE_MEDKEY_MOD) + 1000; // 1000..8999
}

/**
 * Snooze hash: we keep a simple hash but limit the mod so we never escape the snooze band.
 * This is only to spread IDs across 10k nonce blocks; collisions are acceptable because nonce adds entropy,
 * and we also do extra-based cleanup to be robust.
 */
function snoozeHashFromId(medicationId: string): number {
  let acc = 0;
  for (let i = 0; i < medicationId.length; i++) acc = (acc + medicationId.charCodeAt(i)) | 0;
  return Math.abs(acc) % SNOOZE_MEDHASH_MOD; // 0..999
}

// Register action types for medication notifications
export async function registerMedicationActionTypes(): Promise<void> {
  if (!isNative()) return;

  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'MEDICATION_ACTIONS',
          actions: [
            { id: 'take', title: 'Aldım ✓', foreground: true },
            { id: 'snooze', title: '15dk Ertele', foreground: false },
          ],
        },
      ],
    });
    console.log('Medication action types registered');
  } catch (error) {
    console.error('Error registering medication action types:', error);
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
      importance: 5, // MAX - sound + heads-up
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
// Each medication gets a 10,000 ID block (medKey * 10000): supports 30 days × 8 time slots
function generateNotificationId(medicationId: string, dayOffset: number, timeIndex: number): number {
  const medKey = medKeyFromId(medicationId);
  const safeTimeIndex = Math.min(Math.max(timeIndex, 0), 7);
  const safeDayOffset = Math.min(Math.max(dayOffset, 0), 29);
  return MEDICATION_NOTIFICATION_BASE_ID + medKey * 10000 + safeDayOffset * 100 + safeTimeIndex;
}

// Cancel all medication notifications (schedule + snooze) in our reserved band
export async function cancelMedicationNotifications(): Promise<void> {
  if (!isNative()) return;

  try {
    const pending = await LocalNotifications.getPending();
    // ✅ SADECE schedule notification'larını iptal et, snooze bandına dokunma
    const scheduleFloor = MEDICATION_NOTIFICATION_BASE_ID;
    const scheduleCeil = MEDICATION_NOTIFICATION_BASE_ID + SNOOZE_OFFSET; // snooze bandı başlangıcı

    const medicationNotifications = pending.notifications.filter(
      (n) =>
        typeof n.id === 'number' &&
        n.id >= scheduleFloor &&
        n.id < scheduleCeil
    );

    if (medicationNotifications.length > 0) {
      await LocalNotifications.cancel({ notifications: medicationNotifications });
      console.log(`Cancelled ${medicationNotifications.length} medication notifications`);
    }
  } catch (error) {
    console.error('Error cancelling medication notifications:', error);
  }
}

// Get pending medication notifications (for debug)
export async function getPendingMedicationNotifications(): Promise<LocalNotificationSchema[]> {
  if (!isNative()) return [];

  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.filter(
      (n) =>
        typeof n.id === 'number' &&
        n.id >= MEDICATION_NOTIFICATION_BASE_ID &&
        n.id < MEDICATION_NOTIFICATION_BASE_ID + MEDICATION_ID_MAX
    );
  } catch (error) {
    console.error('Error getting pending medication notifications:', error);
    return [];
  }
}

/**
 * Cancel all snooze notifications for a given medicationId by looking at extras.
 * This is collision-proof even if snooze IDs share blocks across medications.
 */
async function cancelSnoozesForMedication(medicationId: string): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    const snoozeFloor = MEDICATION_NOTIFICATION_BASE_ID + SNOOZE_OFFSET;
    const snoozeCeil = MEDICATION_NOTIFICATION_BASE_ID + MEDICATION_ID_MAX; // band end
    const toCancel = pending.notifications.filter((n) => {
      if (typeof n.id !== 'number') return false;
      if (n.id < snoozeFloor || n.id >= snoozeCeil) return false;
      const ex: any = (n as any).extra;
      return ex?.type === 'medication_reminder' && ex?.medicationId === medicationId;
    });

    if (toCancel.length) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  } catch {
    // swallow
  }
}

// Handle notification action
export async function handleMedicationNotificationAction(action: ActionPerformed): Promise<void> {
  const { actionId, notification } = action;
  const extra: any = (notification as any)?.extra;

  if (!extra || extra.type !== 'medication_reminder') return;

  const medicationId: string = extra.medicationId;
  const medicationName: string = extra.medicationName;

  if (actionId === 'take') {
    // Use original scheduled date/time from extra (handles midnight crossover)
    const scheduledAt = extra.scheduledAtISO ? new Date(String(extra.scheduledAtISO)) : new Date();
    const day = format(scheduledAt, 'yyyy-MM-dd');
    const timeLabel = (extra.scheduledTime as string | undefined) || format(scheduledAt, 'HH:mm');

    // Idempotent: set taken=true
    await toggleMedicationLog(medicationId, day, timeLabel, true);

    // Dismiss the current notification
    if (notification?.id) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notification.id }] });
      } catch {}
    }

    // Cancel any pending snoozes for this medication
    await cancelSnoozesForMedication(medicationId);

    console.log(`Medication ${medicationName} marked as taken`);
    return;
  }

  if (actionId === 'snooze') {
    // Prevent double-tap: cancel the current notification first
    if (notification?.id) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notification.id }] });
      } catch {}
    }

    // Also cancel any existing snooze notifications for this med before scheduling a new one (no spam)
    await cancelSnoozesForMedication(medicationId);

    const snoozeBase = MEDICATION_NOTIFICATION_BASE_ID + SNOOZE_OFFSET;
    const medHash = snoozeHashFromId(medicationId);
    const nonce = ((Date.now() % 10000) ^ (_snoozeSeq++ % 10000)) % 10000;
    const snoozeId = snoozeBase + medHash * 10000 + nonce;

    const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
    const newTimeLabel = format(snoozeTime, 'HH:mm');

    await LocalNotifications.schedule({
      notifications: [
        {
          id: snoozeId,
          title: `💊 ${medicationName} - Hatırlatma`,
          body: `${medicationName} dozunu almayı unutma! (Ertelendi: ${newTimeLabel})`,
          schedule: { at: snoozeTime },
          channelId: MEDICATION_NOTIFICATION_CHANNEL,
          sound: 'notification.wav',
          smallIcon: 'ic_stat_icon',
          actionTypeId: 'MEDICATION_ACTIONS',
          extra: {
            ...extra,
            scheduledTime: newTimeLabel,
            scheduledAtISO: snoozeTime.toISOString(),
            originalScheduledTime: extra.originalScheduledTime || extra.scheduledTime,
            type: 'medication_reminder',
            medicationId,
            medicationName,
          },
        },
      ],
    });

    console.log(`Medication ${medicationName} snoozed for 15 minutes (id: ${snoozeId})`);
  }
}

// Schedule medication notifications for a single medication
export async function scheduleMedicationNotification(medication: Medication): Promise<void> {
  if (!isNative()) return;

  if (!medication.isActive || medication.reminderTimes.length === 0) return;

  const notifications: LocalNotificationSchema[] = [];
  const now = new Date();

  // Schedule notifications for the next 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const targetDate = addDays(now, dayOffset);

    medication.reminderTimes.forEach((time, timeIndex) => {
      if (timeIndex >= 8) return; // UI limited to 8 reminder times
      const [hour, minute] = time.split(':').map(Number);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) return;

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
            scheduledAtISO: notificationTime.toISOString(),
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
  const activeMedications = medications.filter((m) => m.isActive);

  for (const medication of activeMedications) {
    await scheduleMedicationNotification(medication);
  }

  console.log(`Scheduled notifications for ${activeMedications.length} medications`);
}

// Schedule a one-time reminder for taking medication (e.g., snooze)
export async function scheduleOneTimeMedicationReminder(
  medication: Medication,
  delayMinutes: number = 15
): Promise<void> {
  if (!isNative()) return;

  const notificationTime = new Date(Date.now() + delayMinutes * 60 * 1000);

  try {
    const timeLabel = format(notificationTime, 'HH:mm');
    const snoozeBase = MEDICATION_NOTIFICATION_BASE_ID + SNOOZE_OFFSET;
    const medHash = snoozeHashFromId(medication.id);
    const nonce = ((Date.now() % 10000) ^ (_snoozeSeq++ % 10000)) % 10000;
    const id = snoozeBase + medHash * 10000 + nonce;

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: `💊 ${medication.name} - Hatırlatma`,
          body: `${medication.dosage} almayı unutma! (${timeLabel})`,
          schedule: { at: notificationTime },
          channelId: MEDICATION_NOTIFICATION_CHANNEL,
          sound: 'notification.wav',
          smallIcon: 'ic_stat_icon',
          actionTypeId: 'MEDICATION_ACTIONS',
          extra: {
            medicationId: medication.id,
            medicationName: medication.name,
            scheduledTime: timeLabel,
            scheduledAtISO: notificationTime.toISOString(),
            type: 'medication_reminder',
          },
        },
      ],
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
      notifications: [
        {
          id: MEDICATION_NOTIFICATION_BASE_ID + MEDICATION_ID_MAX - 1,
          title: '💊 Test İlaç Hatırlatması',
          body: 'İlaç bildirimleri düzgün çalışıyor!',
          schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
          channelId: MEDICATION_NOTIFICATION_CHANNEL,
          sound: 'notification.wav',
          smallIcon: 'ic_stat_icon',
        },
      ],
    });
  } catch (error) {
    console.error('Error sending test medication notification:', error);
    throw error;
  }
}
