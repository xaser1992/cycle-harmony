// 💊 Medication Storage Service
import { Preferences } from '@capacitor/preferences';
import type { Medication, MedicationLog } from '@/types/medication';

const STORAGE_KEYS = {
  MEDICATIONS: 'medications',
  MEDICATION_LOGS: 'medication_logs',
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

// Medications
export async function getMedications(): Promise<Medication[]> {
  const medications = await getItem<Medication[]>(STORAGE_KEYS.MEDICATIONS);
  return medications || [];
}

export async function saveMedication(medication: Medication): Promise<void> {
  const medications = await getMedications();
  const existingIndex = medications.findIndex(m => m.id === medication.id);
  
  if (existingIndex >= 0) {
    medications[existingIndex] = medication;
  } else {
    medications.push(medication);
  }
  
  return setItem(STORAGE_KEYS.MEDICATIONS, medications);
}

export async function deleteMedication(id: string): Promise<void> {
  const medications = await getMedications();
  const filtered = medications.filter(m => m.id !== id);
  return setItem(STORAGE_KEYS.MEDICATIONS, filtered);
}

// Medication Logs
export async function getMedicationLogs(): Promise<MedicationLog[]> {
  const logs = await getItem<MedicationLog[]>(STORAGE_KEYS.MEDICATION_LOGS);
  return logs || [];
}

export async function getMedicationLogsForDate(date: string): Promise<MedicationLog[]> {
  const logs = await getMedicationLogs();
  return logs.filter(log => log.date === date);
}

export async function getMedicationLogsForMedication(medicationId: string): Promise<MedicationLog[]> {
  const logs = await getMedicationLogs();
  return logs.filter(log => log.medicationId === medicationId);
}

export async function saveMedicationLog(log: MedicationLog): Promise<void> {
  const logs = await getMedicationLogs();
  const existingIndex = logs.findIndex(l => l.id === log.id);
  
  if (existingIndex >= 0) {
    logs[existingIndex] = log;
  } else {
    logs.push(log);
  }
  
  // Sort by date descending
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return setItem(STORAGE_KEYS.MEDICATION_LOGS, logs);
}

export async function toggleMedicationLog(
  medicationId: string, 
  date: string, 
  time: string,
  taken: boolean
): Promise<MedicationLog> {
  const logs = await getMedicationLogs();
  const existingLog = logs.find(
    l => l.medicationId === medicationId && l.date === date && l.time === time
  );
  
  if (existingLog) {
    existingLog.taken = taken;
    await setItem(STORAGE_KEYS.MEDICATION_LOGS, logs);
    return existingLog;
  } else {
    const newLog: MedicationLog = {
      id: `${medicationId}_${date}_${time}_${Date.now()}`,
      medicationId,
      date,
      time,
      taken,
    };
    logs.push(newLog);
    await setItem(STORAGE_KEYS.MEDICATION_LOGS, logs);
    return newLog;
  }
}

// Get adherence stats for a medication
export async function getMedicationStats(medicationId: string, days: number = 30) {
  const logs = await getMedicationLogsForMedication(medicationId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentLogs = logs.filter(log => new Date(log.date) >= cutoffDate);
  const totalTaken = recentLogs.filter(log => log.taken).length;
  const totalSkipped = recentLogs.filter(log => !log.taken).length;
  const totalScheduled = recentLogs.length;
  
  return {
    medicationId,
    totalScheduled,
    totalTaken,
    totalSkipped,
    adherenceRate: totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 0,
  };
}

// Clear medication data
export async function clearMedicationData(): Promise<void> {
  await Promise.all([
    Preferences.remove({ key: STORAGE_KEYS.MEDICATIONS }),
    Preferences.remove({ key: STORAGE_KEYS.MEDICATION_LOGS }),
  ]);
}
