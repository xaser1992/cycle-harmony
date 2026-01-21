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
  symptoms: string[]; // Extended to support all symptom types
  mood?: string; // Extended to support all mood types
  notes?: string;
  intimacy?: boolean;
  protection?: boolean;
  testResult?: 'positive' | 'negative' | null;
  // Extended tracking data
  sexualActivity?: string[];
  discharge?: string[];
  digestion?: string[];
  pregnancyTest?: string;
  ovulationTest?: string;
  activity?: string[];
  other?: string[];
  waterGlasses?: number;
  weight?: number;
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
  // Wellness goals
  targetWeight?: number; // kg
  dailyWaterGoal?: number; // glasses (default: 9 = 2.25L)
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
  lastPeriodStart: '', // Empty by default - must be set during onboarding
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
  targetWeight: 60,
  dailyWaterGoal: 9,
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

// Extended category labels for UpdateSheet items
export const DISCHARGE_LABELS: Record<string, { tr: string; en: string; emoji: string }> = {
  none: { tr: 'Akıntı yok', en: 'No discharge', emoji: '🚫' },
  slippery: { tr: 'Kaygan', en: 'Slippery', emoji: '💧' },
  watery: { tr: 'Sulu', en: 'Watery', emoji: '💦' },
  sticky: { tr: 'Yapışkan', en: 'Sticky', emoji: '💧' },
  egg_white: { tr: 'Yumurta akı', en: 'Egg white', emoji: '💧' },
  spotting: { tr: 'Lekelenme', en: 'Spotting', emoji: '🩸' },
  unusual: { tr: 'Olağandışı', en: 'Unusual', emoji: '👤' },
  white_clumpy: { tr: 'Beyaz, topaklı', en: 'White, clumpy', emoji: '⚪' },
  gray: { tr: 'Gri', en: 'Gray', emoji: '⬛' },
};

export const SEXUAL_LABELS: Record<string, { tr: string; en: string; emoji: string }> = {
  no_sex: { tr: 'Yapmadım', en: 'Did not have sex', emoji: '💔' },
  protected: { tr: 'Korunmalı', en: 'Protected', emoji: '❤️' },
  unprotected: { tr: 'Korunmasız', en: 'Unprotected', emoji: '💗' },
  oral: { tr: 'Oral seks', en: 'Oral sex', emoji: '💋' },
  anal: { tr: 'Anal seks', en: 'Anal sex', emoji: '❣️' },
  masturbation: { tr: 'Mastürbasyon', en: 'Masturbation', emoji: '💕' },
  touching: { tr: 'Haz veren dokunma', en: 'Intimate touching', emoji: '💞' },
  toys: { tr: 'Seks oyuncakları', en: 'Sex toys', emoji: '💝' },
  orgasm: { tr: 'Orgazm', en: 'Orgasm', emoji: '✨' },
  high_drive: { tr: 'Yüksek cinsel istek', en: 'High sex drive', emoji: '❤️' },
  neutral_drive: { tr: 'Nötr seviyede', en: 'Neutral', emoji: '🧡' },
  low_drive: { tr: 'Düşük seviyede', en: 'Low', emoji: '💛' },
};

export const ACTIVITY_LABELS: Record<string, { tr: string; en: string; emoji: string }> = {
  none: { tr: 'Egzersiz yapmadım', en: 'No exercise', emoji: '🚫' },
  yoga: { tr: 'Yoga', en: 'Yoga', emoji: '🧘' },
  weights: { tr: 'Ağırlık', en: 'Weights', emoji: '💪' },
  aerobics: { tr: 'Aerobik ve dans', en: 'Aerobics', emoji: '🎵' },
  swimming: { tr: 'Yüzme', en: 'Swimming', emoji: '🏊' },
  team_sports: { tr: 'Takım sporları', en: 'Team sports', emoji: '⚽' },
  running: { tr: 'Koşu', en: 'Running', emoji: '🏃' },
  cycling: { tr: 'Bisiklet', en: 'Cycling', emoji: '🚴' },
  walking: { tr: 'Yürüyüş', en: 'Walking', emoji: '🚶' },
};

export const DIGESTION_LABELS: Record<string, { tr: string; en: string; emoji: string }> = {
  nausea: { tr: 'Bulantı', en: 'Nausea', emoji: '🤢' },
  bloating: { tr: 'Şişkinlik', en: 'Bloating', emoji: '🎈' },
  constipation: { tr: 'Kabızlık', en: 'Constipation', emoji: '🔵' },
  diarrhea: { tr: 'İshal', en: 'Diarrhea', emoji: '💧' },
};

export const OTHER_LABELS: Record<string, { tr: string; en: string; emoji: string }> = {
  travel: { tr: 'Seyahat', en: 'Travel', emoji: '📍' },
  stress: { tr: 'Stres', en: 'Stress', emoji: '⚡' },
  meditation: { tr: 'Meditasyon', en: 'Meditation', emoji: '🧘' },
  journal: { tr: 'Günlük tutma', en: 'Journal', emoji: '📒' },
  kegel: { tr: 'Kegel egzersizleri', en: 'Kegel exercises', emoji: '💪' },
  breathing: { tr: 'Nefes egzersizleri', en: 'Breathing exercises', emoji: '🫁' },
  illness: { tr: 'Hastalık veya İncinme', en: 'Illness or injury', emoji: '🤒' },
  alcohol: { tr: 'Alkol', en: 'Alcohol', emoji: '🍷' },
};
