// 💊 Medication Tracking Type Definitions

export type MedicationFrequency = 'daily' | 'twice_daily' | 'weekly' | 'as_needed' | 'custom';

export type MedicationCategory = 
  | 'birth_control'
  | 'pain_relief'
  | 'hormone'
  | 'vitamin'
  | 'supplement'
  | 'prescription'
  | 'other';

export interface Medication {
  id: string;
  name: string;
  category: MedicationCategory;
  dosage: string;
  frequency: MedicationFrequency;
  reminderTimes: string[]; // HH:mm format array
  notes?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  date: string; // ISO date
  time: string; // HH:mm format
  taken: boolean;
  skippedReason?: string;
}

export interface MedicationStats {
  medicationId: string;
  totalScheduled: number;
  totalTaken: number;
  totalSkipped: number;
  adherenceRate: number;
}

// Category labels
export const MEDICATION_CATEGORY_LABELS: Record<MedicationCategory, { tr: string; en: string; emoji: string }> = {
  birth_control: { tr: 'Doğum Kontrol', en: 'Birth Control', emoji: '💊' },
  pain_relief: { tr: 'Ağrı Kesici', en: 'Pain Relief', emoji: '💉' },
  hormone: { tr: 'Hormon', en: 'Hormone', emoji: '🧬' },
  vitamin: { tr: 'Vitamin', en: 'Vitamin', emoji: '🍊' },
  supplement: { tr: 'Takviye', en: 'Supplement', emoji: '🌿' },
  prescription: { tr: 'Reçeteli', en: 'Prescription', emoji: '📋' },
  other: { tr: 'Diğer', en: 'Other', emoji: '💊' },
};

// Frequency labels
export const MEDICATION_FREQUENCY_LABELS: Record<MedicationFrequency, { tr: string; en: string }> = {
  daily: { tr: 'Günde 1 kez', en: 'Once daily' },
  twice_daily: { tr: 'Günde 2 kez', en: 'Twice daily' },
  weekly: { tr: 'Haftada 1 kez', en: 'Once weekly' },
  as_needed: { tr: 'Gerektiğinde', en: 'As needed' },
  custom: { tr: 'Özel', en: 'Custom' },
};

// Preset colors
export const MEDICATION_COLORS = [
  '#f43f5e', // rose
  '#ec4899', // pink
  '#a855f7', // purple
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#eab308', // yellow
  '#f97316', // orange
];

// Preset icons
export const MEDICATION_ICONS = ['💊', '💉', '🩹', '🧬', '🍊', '🌿', '💧', '🩺', '❤️', '⭐'];
