// 🌸 Calendar Page - Flo Inspired Design with Medication Integration
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isWithinInterval
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { getMedicationLogsForDate, getMedications } from '@/lib/medicationStorage';
import type { DayEntry } from '@/types/cycle';
import type { Medication, MedicationLog } from '@/types/medication';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function CalendarPage() {
  const { openUpdateSheet } = useUpdateSheet();
  const { 
    cycleSettings, 
    prediction, 
    entries, 
    saveDayEntry,
    userSettings 
  } = useCycleData();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<Record<string, MedicationLog[]>>({});

  // Load medications and logs
  useEffect(() => {
    const loadMedicationData = async () => {
      const meds = await getMedications();
      setMedications(meds.filter(m => m.isActive));

      // Load logs for all days in current month view
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      
      const logsMap: Record<string, MedicationLog[]> = {};
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const logs = await getMedicationLogsForDate(dateStr);
        if (logs.length > 0) {
          logsMap[dateStr] = logs;
        }
      }
      setMedicationLogs(logsMap);
    };
    
    loadMedicationData();
  }, [currentMonth]);

  // Get calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Determine day type for coloring
  const getDayType = (date: Date): 'period' | 'fertile' | 'ovulation' | 'pms' | 'predicted' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check actual entries first
    const entry = entries.find(e => e.date === dateStr);
    if (entry && entry.flowLevel !== 'none') {
      return 'period';
    }
    
    if (!prediction) return null;
    
    // Check predicted dates
    const fertileStart = parseISO(prediction.fertileWindowStart);
    const fertileEnd = parseISO(prediction.fertileWindowEnd);
    const ovulationDate = parseISO(prediction.ovulationDate);
    const periodStart = parseISO(prediction.nextPeriodStart);
    const periodEnd = parseISO(prediction.nextPeriodEnd);
    const pmsStart = parseISO(prediction.pmsStart);
    
    if (isSameDay(date, ovulationDate)) return 'ovulation';
    if (isWithinInterval(date, { start: fertileStart, end: fertileEnd })) return 'fertile';
    if (isWithinInterval(date, { start: periodStart, end: periodEnd })) return 'predicted';
    if (isWithinInterval(date, { start: pmsStart, end: periodStart })) return 'pms';
    
    return null;
  };

  const getEntryForDate = (date: Date): DayEntry | undefined => {
    return entries.find(e => e.date === format(date, 'yyyy-MM-dd'));
  };

  const getMedicationLogsForDay = (date: Date): MedicationLog[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return medicationLogs[dateStr] || [];
  };

  const getMedicationProgress = (date: Date): { taken: number; total: number } => {
    const logs = getMedicationLogsForDay(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Calculate total expected doses for this day
    let totalDoses = 0;
    medications.forEach(med => {
      totalDoses += med.reminderTimes.length;
    });
    
    const takenDoses = logs.filter(l => l.taken).length;
    
    return { taken: takenDoses, total: totalDoses };
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    openUpdateSheet({ date });
  };

  const handleCenterPress = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            
            <motion.div
              key={format(currentMonth, 'yyyy-MM')}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-foreground">
                {format(currentMonth, 'MMMM', { locale: tr })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(currentMonth, 'yyyy')}
              </p>
            </motion.div>
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="px-4">
        {/* Legend Pills */}
        <motion.div 
          className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            { color: 'bg-gradient-to-r from-rose-400 to-pink-500', label: 'Regl' },
            { color: 'bg-gradient-to-r from-rose-300/50 to-pink-400/50', label: 'Tahmini' },
            { color: 'bg-gradient-to-r from-cyan-400 to-teal-400', label: 'Doğurgan' },
            { color: 'bg-gradient-to-r from-violet-400 to-purple-500', label: 'Yumurtlama' },
            { color: 'bg-gradient-to-r from-emerald-400 to-green-500', label: 'İlaç ✓', icon: true },
          ].map((item) => (
            <div 
              key={item.label}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border/50 shrink-0"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/80 backdrop-blur-sm rounded-3xl p-4 border border-border/50 shadow-lg"
        >
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const dayType = getDayType(date);
              const isToday = isSameDay(date, new Date());
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const entry = getEntryForDate(date);
              const medProgress = getMedicationProgress(date);
              const hasMedications = medProgress.total > 0;
              const allMedsTaken = medProgress.taken > 0 && medProgress.taken === medProgress.total;
              const someMedsTaken = medProgress.taken > 0 && medProgress.taken < medProgress.total;
              
              return (
                <motion.button
                  key={date.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.008 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDayClick(date)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-sm font-medium transition-all
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}
                    ${dayType === 'period' ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-md shadow-rose-500/30' : ''}
                    ${dayType === 'predicted' ? 'bg-gradient-to-br from-rose-300/40 to-pink-400/40 text-rose-600 dark:text-rose-300' : ''}
                    ${dayType === 'fertile' ? 'bg-gradient-to-br from-cyan-400/30 to-teal-400/30 text-teal-600 dark:text-teal-300' : ''}
                    ${dayType === 'ovulation' ? 'bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-md shadow-violet-500/30' : ''}
                    ${dayType === 'pms' ? 'bg-gradient-to-br from-orange-300/30 to-amber-400/30 text-orange-600 dark:text-orange-300' : ''}
                    ${!dayType && isCurrentMonth ? 'text-foreground hover:bg-muted/50' : ''}
                  `}
                >
                  <span>{format(date, 'd')}</span>
                  
                  {/* Entry indicator (bottom left) */}
                  {entry && (entry.symptoms.length > 0 || entry.mood) && (
                    <motion.span 
                      className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                  
                  {/* Medication indicator (bottom right) */}
                  {hasMedications && isCurrentMonth && (
                    <motion.span 
                      className={`absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full ${
                        allMedsTaken 
                          ? 'bg-emerald-500' 
                          : someMedsTaken 
                            ? 'bg-amber-500' 
                            : 'bg-muted-foreground/30'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Medication Summary for Today */}
        {medications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4"
          >
            <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-violet-200/30 dark:border-violet-800/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Bugünün İlaçları</p>
                  <p className="text-xs text-muted-foreground">
                    {getMedicationProgress(new Date()).taken} / {getMedicationProgress(new Date()).total} doz alındı
                  </p>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${getMedicationProgress(new Date()).total > 0 
                      ? (getMedicationProgress(new Date()).taken / getMedicationProgress(new Date()).total) * 100 
                      : 0}%` 
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Upcoming Events */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 space-y-3"
          >
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Yaklaşan Tarihler</h3>
            
            <div className="space-y-3">
              {/* Next Period Card */}
              <motion.div 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 p-4 shadow-lg shadow-rose-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🌸</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Sonraki Regl</p>
                    <p className="text-sm text-white/80">
                      {format(parseISO(prediction.nextPeriodStart), 'd MMMM EEEE', { locale: tr })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </motion.div>
              
              {/* Ovulation Card */}
              <motion.div 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 p-4 shadow-lg shadow-violet-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">🥚</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Yumurtlama</p>
                    <p className="text-sm text-white/80">
                      {format(parseISO(prediction.ovulationDate), 'd MMMM EEEE', { locale: tr })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </motion.div>

              {/* Fertile Window Card */}
              <motion.div 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 p-4 shadow-lg shadow-teal-500/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl">💐</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Doğurgan Dönem</p>
                    <p className="text-sm text-white/80">
                      {format(parseISO(prediction.fertileWindowStart), 'd MMM', { locale: tr })} - {format(parseISO(prediction.fertileWindowEnd), 'd MMM', { locale: tr })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
