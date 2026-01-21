// 🌸 Cycle Prediction Engine
import { 
  addDays, 
  differenceInDays, 
  parseISO, 
  format, 
  isAfter, 
  isBefore, 
  isToday,
  startOfDay 
} from 'date-fns';
import type { 
  CycleSettings, 
  CyclePrediction, 
  CyclePhase,
  DayEntry 
} from '@/types/cycle';
import type { CycleRecord } from './storage';

/**
 * Calculate predictions based on cycle settings and history
 */
export function calculatePredictions(
  settings: CycleSettings,
  cycleHistory: CycleRecord[] = []
): CyclePrediction {
  // Handle missing or invalid lastPeriodStart - default to 14 days ago
  let lastPeriodStart: Date;
  try {
    if (!settings.lastPeriodStart || settings.lastPeriodStart === '') {
      lastPeriodStart = addDays(new Date(), -14);
    } else {
      lastPeriodStart = parseISO(settings.lastPeriodStart);
      // Check if parsed date is valid
      if (isNaN(lastPeriodStart.getTime())) {
        lastPeriodStart = addDays(new Date(), -14);
      }
    }
  } catch {
    lastPeriodStart = addDays(new Date(), -14);
  }
  
  // Calculate average cycle length from history or use default
  let avgCycleLength = settings.cycleLength;
  let uncertainty = 2; // days ±
  
  if (cycleHistory.length >= 3) {
    const recentCycles = cycleHistory.slice(-6);
    const avgLength = recentCycles.reduce((sum, c) => sum + c.length, 0) / recentCycles.length;
    avgCycleLength = Math.round(avgLength);
    
    // Calculate standard deviation for uncertainty
    const variance = recentCycles.reduce((sum, c) => sum + Math.pow(c.length - avgLength, 2), 0) / recentCycles.length;
    uncertainty = Math.max(1, Math.min(5, Math.round(Math.sqrt(variance))));
  }
  
  // Calculate key dates
  const nextPeriodStart = addDays(lastPeriodStart, avgCycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, settings.periodLength - 1);
  
  // Ovulation: typically 14 days before next period (luteal phase)
  const ovulationDate = addDays(nextPeriodStart, -settings.lutealPhase);
  
  // Fertile window: 5 days before ovulation to 1 day after
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);
  
  // PMS: typically starts after ovulation (luteal phase)
  const pmsStart = addDays(ovulationDate, 2);
  
  return {
    nextPeriodStart: format(nextPeriodStart, 'yyyy-MM-dd'),
    nextPeriodEnd: format(nextPeriodEnd, 'yyyy-MM-dd'),
    ovulationDate: format(ovulationDate, 'yyyy-MM-dd'),
    fertileWindowStart: format(fertileWindowStart, 'yyyy-MM-dd'),
    fertileWindowEnd: format(fertileWindowEnd, 'yyyy-MM-dd'),
    pmsStart: format(pmsStart, 'yyyy-MM-dd'),
    uncertainty,
  };
}

/**
 * Determine current cycle phase for a given date
 */
export function getCyclePhase(
  date: Date,
  settings: CycleSettings,
  prediction: CyclePrediction,
  entries: DayEntry[] = []
): CyclePhase {
  const today = startOfDay(date);
  
  // Handle missing or invalid lastPeriodStart - default to 14 days ago
  let lastPeriodStart: Date;
  try {
    if (!settings.lastPeriodStart || settings.lastPeriodStart === '') {
      lastPeriodStart = addDays(new Date(), -14);
    } else {
      lastPeriodStart = parseISO(settings.lastPeriodStart);
      if (isNaN(lastPeriodStart.getTime())) {
        lastPeriodStart = addDays(new Date(), -14);
      }
    }
  } catch {
    lastPeriodStart = addDays(new Date(), -14);
  }
  
  const lastPeriodEnd = settings.lastPeriodEnd 
    ? parseISO(settings.lastPeriodEnd) 
    : addDays(lastPeriodStart, settings.periodLength - 1);
  
  const nextPeriodStart = parseISO(prediction.nextPeriodStart);
  const ovulationDate = parseISO(prediction.ovulationDate);
  const fertileWindowStart = parseISO(prediction.fertileWindowStart);
  const fertileWindowEnd = parseISO(prediction.fertileWindowEnd);
  const pmsStart = parseISO(prediction.pmsStart);
  
  // Check if currently on period (based on entries with flow)
  const todayEntry = entries.find(e => e.date === format(today, 'yyyy-MM-dd'));
  const isOnPeriod = todayEntry && todayEntry.flowLevel !== 'none';
  
  // Calculate days until next period
  const daysUntilPeriod = differenceInDays(nextPeriodStart, today);
  
  // Check if period is late
  const isLate = daysUntilPeriod < 0;
  const lateDays = isLate ? Math.abs(daysUntilPeriod) : 0;
  
  // Calculate day number in cycle
  const dayNumber = differenceInDays(today, lastPeriodStart) + 1;
  
  // Determine phase
  let type: CyclePhase['type'];
  
  if (isOnPeriod || (dayNumber >= 1 && dayNumber <= settings.periodLength)) {
    type = 'period';
  } else if (!isBefore(today, fertileWindowStart) && !isAfter(today, fertileWindowEnd)) {
    if (isToday(ovulationDate) || format(today, 'yyyy-MM-dd') === prediction.ovulationDate) {
      type = 'ovulation';
    } else {
      type = 'fertile';
    }
  } else if (!isBefore(today, pmsStart) && isBefore(today, nextPeriodStart)) {
    type = 'pms';
  } else if (!isAfter(today, fertileWindowStart)) {
    type = 'follicular';
  } else {
    type = 'luteal';
  }
  
  return {
    type,
    dayNumber: dayNumber > 0 ? dayNumber : dayNumber + settings.cycleLength,
    daysUntilPeriod: Math.max(0, daysUntilPeriod),
    isLate,
    lateDays,
  };
}

/**
 * Get phase display info
 */
export function getPhaseInfo(phase: CyclePhase, language: 'tr' | 'en' = 'tr'): {
  title: string;
  subtitle: string;
  color: string;
  emoji: string;
} {
  const labels = {
    tr: {
      period: { title: 'Regl Dönemi', emoji: '🩸' },
      follicular: { title: 'Foliküler Faz', emoji: '🌱' },
      fertile: { title: 'Doğurgan Dönem', emoji: '💧' },
      ovulation: { title: 'Yumurtlama Günü', emoji: '✨' },
      luteal: { title: 'Luteal Faz', emoji: '🌙' },
      pms: { title: 'PMS Dönemi', emoji: '⚡' },
    },
    en: {
      period: { title: 'Period', emoji: '🩸' },
      follicular: { title: 'Follicular Phase', emoji: '🌱' },
      fertile: { title: 'Fertile Window', emoji: '💧' },
      ovulation: { title: 'Ovulation Day', emoji: '✨' },
      luteal: { title: 'Luteal Phase', emoji: '🌙' },
      pms: { title: 'PMS', emoji: '⚡' },
    },
  };
  
  const colors = {
    period: 'period',
    follicular: 'safe',
    fertile: 'fertile',
    ovulation: 'ovulation',
    luteal: 'safe',
    pms: 'pms',
  };
  
  const phaseLabel = labels[language][phase.type];
  
  let subtitle: string;
  if (phase.isLate) {
    subtitle = language === 'tr' 
      ? `Regl ${phase.lateDays} gün gecikti`
      : `Period is ${phase.lateDays} day${phase.lateDays > 1 ? 's' : ''} late`;
  } else if (phase.type === 'period') {
    subtitle = language === 'tr'
      ? `${phase.dayNumber}. gün`
      : `Day ${phase.dayNumber}`;
  } else if (phase.daysUntilPeriod <= 7) {
    subtitle = language === 'tr'
      ? `Regl'e ${phase.daysUntilPeriod} gün`
      : `${phase.daysUntilPeriod} day${phase.daysUntilPeriod > 1 ? 's' : ''} until period`;
  } else {
    subtitle = language === 'tr'
      ? `Döngünün ${phase.dayNumber}. günü`
      : `Cycle day ${phase.dayNumber}`;
  }
  
  return {
    title: phaseLabel.title,
    subtitle,
    color: colors[phase.type],
    emoji: phaseLabel.emoji,
  };
}

/**
 * Check if a date is in a specific phase
 */
export function isDateInPhase(
  date: string,
  phaseType: CyclePhase['type'],
  settings: CycleSettings,
  prediction: CyclePrediction
): boolean {
  const dateObj = parseISO(date);
  const phase = getCyclePhase(dateObj, settings, prediction);
  return phase.type === phaseType;
}

/**
 * Get all period days in a given month
 */
export function getPeriodDaysInMonth(
  year: number,
  month: number,
  settings: CycleSettings,
  prediction: CyclePrediction,
  entries: DayEntry[]
): string[] {
  const periodDays: string[] = [];
  
  // Get entries with flow in this month
  entries.forEach(entry => {
    const entryDate = parseISO(entry.date);
    if (
      entryDate.getFullYear() === year &&
      entryDate.getMonth() === month &&
      entry.flowLevel !== 'none'
    ) {
      periodDays.push(entry.date);
    }
  });
  
  // Add predicted period days
  const nextPeriodStart = parseISO(prediction.nextPeriodStart);
  for (let i = 0; i < settings.periodLength; i++) {
    const day = addDays(nextPeriodStart, i);
    if (day.getFullYear() === year && day.getMonth() === month) {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (!periodDays.includes(dateStr)) {
        periodDays.push(dateStr);
      }
    }
  }
  
  return periodDays;
}
