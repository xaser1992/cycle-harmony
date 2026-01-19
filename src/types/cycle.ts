// 🌸 Period Tracker Type Definitions

export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

export type Mood = 'happy' | 'calm' | 'sad' | 'anxious' | 'irritable' | 'energetic' | 'tired' | 'neutral';

export type Symptom = 
  | 'cramps'
  | 'headache'
  | 'backache'
  | 'bloating'
  | 'breast_tenderness'
  | 'acne'
  | 'fatigue'
  | 'nausea'
  | 'insomnia'
  | 'hot_flashes'
  | 'dizziness'
  | 'appetite_change'
  | 'cravings'
  | 'constipation'
  | 'diarrhea';

export type PrivacyMode = 'off' | 'partial' | 'full';

export type NotificationType = 
  | 'period_approaching'
  | 'period_expected'
  | 'period_late'
  | 'fertile_start'
  | 'ovulation_day'
  | 'fertile_ending'
  | 'pms_reminder'
  | 'daily_checkin'
  | 'water_reminder'
  | 'exercise_reminder';

export interface CycleSettings {
  cycleLength: number; // days (default: 28)
  periodLength: number; // days (default: 5)
  lutealPhase: number; // days (default: 14)
  lastPeriodStart: string; // ISO date
  lastPeriodEnd?: string; // ISO date (optional)
}

export interface DayEntry {
  date: string; // ISO date
  flowLevel: FlowLevel;
  symptoms: Symptom[];
  mood?: Mood;
  notes?: string;
  intimacy?: boolean;
  protection?: boolean;
  testResult?: 'positive' | 'negative' | null;
}

export interface NotificationPreferences {
  enabled: boolean;
  togglesByType: Record<NotificationType, boolean>;
  preferredTime: string; // HH:mm format
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
  privacyMode: PrivacyMode;
}

export interface UserSettings {
  language: 'tr' | 'en';
  theme: 'light' | 'dark' | 'system';
  appLockEnabled: boolean;
  cloudSyncEnabled: boolean;
  onboardingCompleted: boolean;
  // Personal info for better predictions
  birthDate?: string; // ISO date
  healthConditions?: HealthCondition[];
  contraceptiveMethod?: ContraceptiveMethod;
}

export type HealthCondition = 
  | 'pcos' 
  | 'endometriosis' 
  | 'thyroid' 
  | 'diabetes' 
  | 'none';

export type ContraceptiveMethod = 
  | 'none' 
  | 'pill' 
  | 'iud' 
  | 'implant' 
  | 'injection' 
  | 'condom' 
  | 'natural';

export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  pmsStart: string;
  uncertainty: number; // days ±
}

export interface CyclePhase {
  type: 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'pms';
  dayNumber: number;
  daysUntilPeriod: number;
  isLate: boolean;
  lateDays: number;
}

// Notification content based on privacy mode
export interface NotificationContent {
  title: string;
  body: string;
  privateTitle: string;
  privateBody: string;
}

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  cycleLength: 28,
  periodLength: 5,
  lutealPhase: 14,
  lastPeriodStart: new Date().toISOString().split('T')[0],
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  togglesByType: {
    period_approaching: true,
    period_expected: true,
    period_late: true,
    fertile_start: true,
    ovulation_day: true,
    fertile_ending: true,
    pms_reminder: true,
    daily_checkin: true,
    water_reminder: false,
    exercise_reminder: false,
  },
  preferredTime: '09:00',
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  privacyMode: 'partial',
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'tr',
  theme: 'system',
  appLockEnabled: false,
  cloudSyncEnabled: false,
  onboardingCompleted: false,
  birthDate: undefined,
  healthConditions: [],
  contraceptiveMethod: 'none',
};

// Symptom labels
export const SYMPTOM_LABELS: Record<Symptom, { tr: string; en: string; emoji: string }> = {
  cramps: { tr: 'Kramp', en: 'Cramps', emoji: '😣' },
  headache: { tr: 'Baş Ağrısı', en: 'Headache', emoji: '🤕' },
  backache: { tr: 'Bel Ağrısı', en: 'Backache', emoji: '😮‍💨' },
  bloating: { tr: 'Şişkinlik', en: 'Bloating', emoji: '🫃' },
  breast_tenderness: { tr: 'Göğüs Hassasiyeti', en: 'Breast Tenderness', emoji: '💔' },
  acne: { tr: 'Akne', en: 'Acne', emoji: '😖' },
  fatigue: { tr: 'Yorgunluk', en: 'Fatigue', emoji: '😴' },
  nausea: { tr: 'Mide Bulantısı', en: 'Nausea', emoji: '🤢' },
  insomnia: { tr: 'Uykusuzluk', en: 'Insomnia', emoji: '😵‍💫' },
  hot_flashes: { tr: 'Ateş Basması', en: 'Hot Flashes', emoji: '🥵' },
  dizziness: { tr: 'Baş Dönmesi', en: 'Dizziness', emoji: '😵' },
  appetite_change: { tr: 'İştah Değişimi', en: 'Appetite Change', emoji: '🍽️' },
  cravings: { tr: 'Aşerme', en: 'Cravings', emoji: '🍫' },
  constipation: { tr: 'Kabızlık', en: 'Constipation', emoji: '😬' },
  diarrhea: { tr: 'İshal', en: 'Diarrhea', emoji: '😰' },
};

// Mood labels
export const MOOD_LABELS: Record<Mood, { tr: string; en: string; emoji: string }> = {
  happy: { tr: 'Mutlu', en: 'Happy', emoji: '😊' },
  calm: { tr: 'Sakin', en: 'Calm', emoji: '😌' },
  sad: { tr: 'Üzgün', en: 'Sad', emoji: '😢' },
  anxious: { tr: 'Endişeli', en: 'Anxious', emoji: '😰' },
  irritable: { tr: 'Sinirli', en: 'Irritable', emoji: '😤' },
  energetic: { tr: 'Enerjik', en: 'Energetic', emoji: '⚡' },
  tired: { tr: 'Yorgun', en: 'Tired', emoji: '😩' },
  neutral: { tr: 'Nötr', en: 'Neutral', emoji: '😐' },
};

// Flow level labels
export const FLOW_LABELS: Record<FlowLevel, { tr: string; en: string; emoji: string }> = {
  none: { tr: 'Yok', en: 'None', emoji: '⚪' },
  spotting: { tr: 'Lekelenme', en: 'Spotting', emoji: '🔵' },
  light: { tr: 'Hafif', en: 'Light', emoji: '🩸' },
  medium: { tr: 'Orta', en: 'Medium', emoji: '🩸🩸' },
  heavy: { tr: 'Yoğun', en: 'Heavy', emoji: '🩸🩸🩸' },
};
