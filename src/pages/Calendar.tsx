// 🌸 Calendar Page - Flo Inspired Design with Medication Integration
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pill, X, Edit3, Bell } from 'lucide-react';
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
  isWithinInterval,
  differenceInDays,
  addDays
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { getMedicationLogsForDate, getMedications } from '@/lib/medicationStorage';
import { scheduleCustomReminder } from '@/lib/notifications';
import { FLOW_LABELS, SYMPTOM_LABELS, MOOD_LABELS } from '@/types/cycle';
import type { DayEntry } from '@/types/cycle';
import type { Medication, MedicationLog } from '@/types/medication';
import { toast } from 'sonner';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// Fertility chance by days relative to ovulation
const getFertilityChance = (daysFromOvulation: number): number => {
  const chances: Record<number, number> = {
    [-5]: 10,
    [-4]: 16,
    [-3]: 25,
    [-2]: 30,
    [-1]: 25,
    [0]: 33, // Ovulation day
    [1]: 8,
  };
  return chances[daysFromOvulation] ?? 0;
};

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
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<Record<string, MedicationLog[]>>({});
  const [activeInfoCard, setActiveInfoCard] = useState<'period' | 'ovulation' | 'fertile' | null>(null);

  // Month navigation via buttons only (swipe disabled to allow tab switching)

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
    setShowDayDetail(true);
  };

  const handleEditDay = () => {
    if (selectedDate) {
      setShowDayDetail(false);
      openUpdateSheet({ date: selectedDate });
    }
  };

  const handleCenterPress = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  // Get day type label for detail card
  const getDayTypeLabel = (type: string | null): { label: string; color: string } => {
    switch (type) {
      case 'period': return { label: 'Regl Günü', color: 'from-rose-400 to-pink-500' };
      case 'predicted': return { label: 'Tahmini Regl', color: 'from-rose-300 to-pink-400' };
      case 'fertile': return { label: 'Doğurgan Dönem', color: 'from-cyan-400 to-teal-400' };
      case 'ovulation': return { label: 'Yumurtlama Günü', color: 'from-violet-400 to-purple-500' };
      case 'pms': return { label: 'PMS Dönemi', color: 'from-orange-300 to-amber-400' };
      default: return { label: 'Normal Gün', color: 'from-muted to-muted' };
    }
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

      <main className="px-4 pt-2">
        {/* Calendar Grid */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-4 border border-border/50 shadow-lg">
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
        </div>

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
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 p-4 shadow-lg shadow-rose-500/20 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveInfoCard('period')}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <motion.span 
                      className="text-2xl"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      🌸
                    </motion.span>
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
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 p-4 shadow-lg shadow-violet-500/20 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveInfoCard('ovulation')}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                        <circle cx="12" cy="12" r="5" fill="#a855f7" opacity="0.6" />
                        <circle cx="10" cy="10" r="2" fill="white" opacity="0.8" />
                      </svg>
                    </motion.div>
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
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 p-4 shadow-lg shadow-teal-500/20 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveInfoCard('fertile')}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                        <path d="M12 21c-1.5-1.5-6-5-6-10a6 6 0 1 1 12 0c0 5-4.5 8.5-6 10z" fill="white" opacity="0.9" />
                        <path d="M12 18c-1-1-4-3.5-4-7a4 4 0 1 1 8 0c0 3.5-3 6-4 7z" fill="#14b8a6" opacity="0.5" />
                        <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.8" />
                      </svg>
                    </motion.div>
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

        {/* Info Modal for Upcoming Dates */}
        <AnimatePresence>
          {activeInfoCard && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                onClick={() => setActiveInfoCard(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`fixed inset-x-4 top-20 bottom-20 z-[101] rounded-3xl p-6 shadow-2xl overflow-y-auto ${
                  activeInfoCard === 'period' ? 'bg-gradient-to-br from-rose-400 to-pink-500' :
                  activeInfoCard === 'ovulation' ? 'bg-gradient-to-br from-violet-400 to-purple-500' :
                  'bg-gradient-to-br from-cyan-400 to-teal-400'
                }`}
              >
                {/* Close Button - Fixed position with high z-index */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveInfoCard(null);
                  }}
                  className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-[102] active:scale-90 transition-transform"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Period Info */}
                {activeInfoCard === 'period' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <motion.span 
                        className="text-5xl"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        🌸
                      </motion.span>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Sonraki Regl</h3>
                        <p className="text-white/80">{format(parseISO(prediction!.nextPeriodStart), 'd MMMM EEEE', { locale: tr })}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">📋 Ne Beklemeli?</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          <li>• Adet kanaması ortalama {cycleSettings.periodLength} gün sürer</li>
                          <li>• İlk 1-2 gün akış daha yoğun olabilir</li>
                          <li>• Kramp, yorgunluk ve ruh hali değişimleri normal</li>
                        </ul>
                      </div>
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">💡 İpuçları</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          <li>• Bol su için ve demir açısından zengin gıdalar tüketin</li>
                          <li>• Sıcak kompres ağrıları hafifletebilir</li>
                          <li>• Hafif egzersiz ve yoga faydalı olabilir</li>
                        </ul>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveInfoCard(null);
                          setSelectedDate(parseISO(prediction!.nextPeriodStart));
                          setShowDayDetail(true);
                        }}
                        className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit3 className="w-5 h-5 text-white" />
                        <span className="font-semibold text-white text-sm">Günü Görüntüle</span>
                      </button>
                      <button
                        onClick={async () => {
                          const success = await scheduleCustomReminder(
                            'Regl Yaklaşıyor 🌸',
                            'Regl dönemin yarın başlayabilir. Hazırlıklı ol!',
                            addDays(parseISO(prediction!.nextPeriodStart), -1),
                            'tr'
                          );
                          if (success) {
                            toast.success('Hatırlatıcı kuruldu!');
                          } else {
                            toast.error('Bildirim izni gerekli');
                          }
                        }}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Bell className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Ovulation Info */}
                {activeInfoCard === 'ovulation' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                          <circle cx="12" cy="12" r="6" fill="#a855f7" opacity="0.6" />
                          <circle cx="9" cy="9" r="2.5" fill="white" opacity="0.8" />
                        </svg>
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Yumurtlama Günü</h3>
                        <p className="text-white/80">{format(parseISO(prediction!.ovulationDate), 'd MMMM EEEE', { locale: tr })}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">🥚 Yumurtlama Nedir?</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          <li>• Yumurtalıktan olgun bir yumurta salınır</li>
                          <li>• En verimli gününüz - hamilelik şansı en yüksek</li>
                          <li>• Yumurta 12-24 saat boyunca döllenebilir</li>
                        </ul>
                      </div>
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">✨ Belirtiler</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          <li>• Vücut sıcaklığında hafif artış</li>
                          <li>• Servikal mukus yumurta akı kıvamında</li>
                          <li>• Cinsel istek artışı olabilir</li>
                          <li>• Bazı kadınlarda hafif kasık ağrısı</li>
                        </ul>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveInfoCard(null);
                          setSelectedDate(parseISO(prediction!.ovulationDate));
                          setShowDayDetail(true);
                        }}
                        className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit3 className="w-5 h-5 text-white" />
                        <span className="font-semibold text-white text-sm">Günü Görüntüle</span>
                      </button>
                      <button
                        onClick={async () => {
                          const success = await scheduleCustomReminder(
                            'Yumurtlama Günü 🥚',
                            'Bugün tahmini yumurtlama günün!',
                            parseISO(prediction!.ovulationDate),
                            'tr'
                          );
                          if (success) {
                            toast.success('Hatırlatıcı kuruldu!');
                          } else {
                            toast.error('Bildirim izni gerekli');
                          }
                        }}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Bell className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Fertile Window Info */}
                {activeInfoCard === 'fertile' && prediction && (() => {
                  const ovulationDate = parseISO(prediction.ovulationDate);
                  const fertileStart = parseISO(prediction.fertileWindowStart);
                  const fertileEnd = parseISO(prediction.fertileWindowEnd);
                  const fertileDays = eachDayOfInterval({ start: fertileStart, end: fertileEnd });
                  
                  return (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 22c-2-2-8-6.5-8-13a8 8 0 1 1 16 0c0 6.5-6 11-8 13z" fill="white" opacity="0.9" />
                            <path d="M12 18c-1.3-1.3-5-4.5-5-9a5 5 0 1 1 10 0c0 4.5-3.7 7.7-5 9z" fill="#14b8a6" opacity="0.5" />
                            <circle cx="10" cy="9" r="2" fill="white" opacity="0.8" />
                          </svg>
                        </motion.div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Doğurgan Dönem</h3>
                          <p className="text-white/80">
                            {format(fertileStart, 'd MMM', { locale: tr })} - {format(fertileEnd, 'd MMM', { locale: tr })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Fertile Days with Pregnancy Chances */}
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          📊 Günlük Hamilelik Şansı
                        </h4>
                        <div className="space-y-2">
                          {fertileDays.map((day) => {
                            const daysFromOvulation = differenceInDays(day, ovulationDate);
                            const chance = getFertilityChance(daysFromOvulation);
                            const isOvulationDay = daysFromOvulation === 0;
                            
                            return (
                              <div key={day.toISOString()} className="flex items-center gap-3">
                                <div className="w-14 text-xs text-white/80">
                                  {format(day, 'd MMM', { locale: tr })}
                                </div>
                                <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${isOvulationDay ? 'bg-gradient-to-r from-violet-400 to-purple-500' : 'bg-white/60'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${chance}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                  />
                                </div>
                                <div className={`w-10 text-right text-sm font-bold ${isOvulationDay ? 'text-white' : 'text-white/80'}`}>
                                  {chance}%
                                </div>
                                {isOvulationDay && (
                                  <span className="text-xs bg-violet-500/50 px-2 py-0.5 rounded-full text-white">
                                    🥚
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-2">🎯 Önemli Bilgiler</h4>
                        <ul className="text-sm text-white/90 space-y-1">
                          <li>• Yumurtlama günü en yüksek şans (%33)</li>
                          <li>• Sperm 5 güne kadar canlı kalabilir</li>
                          <li>• Hamilelik istemiyorsanız korunma şart</li>
                        </ul>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setActiveInfoCard(null);
                            setSelectedDate(fertileStart);
                            setShowDayDetail(true);
                          }}
                          className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Edit3 className="w-5 h-5 text-white" />
                          <span className="font-semibold text-white text-sm">İlk Günü Görüntüle</span>
                        </button>
                        <button
                          onClick={async () => {
                            const success = await scheduleCustomReminder(
                              'Doğurgan Dönem Başlıyor 💐',
                              'Yumurtlama dönemin başlıyor!',
                              fertileStart,
                              'tr'
                            );
                            if (success) {
                              toast.success('Hatırlatıcı kuruldu!');
                            } else {
                              toast.error('Bildirim izni gerekli');
                            }
                          }}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Bell className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Day Detail Bottom Sheet */}
      <AnimatePresence>
        {showDayDetail && selectedDate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={() => setShowDayDetail(false)}
            />
            
            {/* Detail Card */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isSameDay(selectedDate, new Date()) ? 'Bugün' : format(selectedDate, 'EEEE', { locale: tr })}
                    </p>
                    <h2 className="text-2xl font-bold text-foreground">
                      {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleEditDay}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Edit3 className="w-5 h-5 text-primary" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDayDetail(false)}
                      className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  </div>
                </div>

                {/* Day Type Badge */}
                {(() => {
                  const dayType = getDayType(selectedDate);
                  const typeInfo = getDayTypeLabel(dayType);
                  return (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${typeInfo.color} text-white text-sm font-medium mb-4`}>
                      <span>
                        {dayType === 'period' ? '🩸' : dayType === 'fertile' ? '🌱' : dayType === 'ovulation' ? '🥚' : dayType === 'pms' ? '🌙' : '📅'}
                      </span>
                      {typeInfo.label}
                    </div>
                  );
                })()}
              </div>

              {/* Content */}
              <div className="px-6 pb-8 space-y-4 overflow-y-auto max-h-[40vh]">
                {/* Entry Summary */}
                {(() => {
                  const entry = getEntryForDate(selectedDate);
                  if (!entry && getMedicationProgress(selectedDate).total === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Bu gün için kayıt yok</p>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={handleEditDay}
                          className="mt-3 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                        >
                          Kayıt Ekle
                        </motion.button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Flow Level */}
                      {entry && entry.flowLevel !== 'none' && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                            <span className="text-lg">{FLOW_LABELS[entry.flowLevel].emoji}</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Akış</p>
                            <p className="font-semibold text-foreground">{FLOW_LABELS[entry.flowLevel].tr}</p>
                          </div>
                        </div>
                      )}

                      {/* Mood */}
                      {entry?.mood && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                            <span className="text-lg">{MOOD_LABELS[entry.mood]?.emoji || '😊'}</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ruh Hali</p>
                            <p className="font-semibold text-foreground">{MOOD_LABELS[entry.mood]?.tr || entry.mood}</p>
                          </div>
                        </div>
                      )}

                      {/* Symptoms */}
                      {entry && entry.symptoms.length > 0 && (
                        <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/30">
                          <p className="text-xs text-muted-foreground mb-2">Semptomlar</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.symptoms.map(symptom => {
                              const label = SYMPTOM_LABELS[symptom];
                              return (
                                <span
                                  key={symptom}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/50 text-xs font-medium text-violet-700 dark:text-violet-300"
                                >
                                  <span>{label?.emoji || '•'}</span>
                                  {label?.tr || symptom}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sexual Activity */}
                      {entry?.sexualActivity && entry.sexualActivity.length > 0 && (
                        <div className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/30">
                          <p className="text-xs text-muted-foreground mb-2">Cinsel Aktivite</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.sexualActivity.map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-900/50 text-xs font-medium text-pink-700 dark:text-pink-300"
                              >
                                💕 {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Discharge */}
                      {entry?.discharge && entry.discharge.length > 0 && (
                        <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30">
                          <p className="text-xs text-muted-foreground mb-2">Vajinal Akıntı</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.discharge.map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50 text-xs font-medium text-purple-700 dark:text-purple-300"
                              >
                                💧 {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activity */}
                      {entry?.activity && entry.activity.length > 0 && (
                        <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-950/30">
                          <p className="text-xs text-muted-foreground mb-2">Fiziksel Aktivite</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.activity.map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-xs font-medium text-green-700 dark:text-green-300"
                              >
                                🏃 {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Water Intake */}
                      {entry?.waterGlasses && entry.waterGlasses > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                            <span className="text-lg">💧</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Su Tüketimi</p>
                            <p className="font-semibold text-foreground">{(entry.waterGlasses * 0.25).toFixed(2)} L</p>
                          </div>
                        </div>
                      )}

                      {/* Weight */}
                      {entry?.weight && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center">
                            <span className="text-lg">⚖️</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ağırlık</p>
                            <p className="font-semibold text-foreground">{entry.weight} kg</p>
                          </div>
                        </div>
                      )}

                      {/* Pregnancy Test */}
                      {entry?.pregnancyTest && entry.pregnancyTest !== 'not_taken' && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                            <span className="text-lg">🧪</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gebelik Testi</p>
                            <p className="font-semibold text-foreground">
                              {entry.pregnancyTest === 'positive' ? 'Pozitif' : 
                               entry.pregnancyTest === 'negative' ? 'Negatif' : 
                               entry.pregnancyTest === 'faint_line' ? 'Soluk çizgi' : entry.pregnancyTest}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Ovulation Test */}
                      {entry?.ovulationTest && entry.ovulationTest !== 'not_taken' && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                            <span className="text-lg">📊</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ovülasyon Testi</p>
                            <p className="font-semibold text-foreground">
                              {entry.ovulationTest === 'positive' ? 'Pozitif' : 
                               entry.ovulationTest === 'negative' ? 'Negatif' : 
                               entry.ovulationTest === 'own_method' ? 'Kendi yöntemim' : entry.ovulationTest}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {entry?.notes && (
                        <div className="p-3 rounded-2xl bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Notlar</p>
                          <p className="text-sm text-foreground">{entry.notes}</p>
                        </div>
                      )}

                      {/* Medication Status */}
                      {(() => {
                        const medProgress = getMedicationProgress(selectedDate);
                        if (medProgress.total === 0) return null;
                        
                        return (
                          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                <Pill className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">İlaç Durumu</p>
                                <p className="font-semibold text-foreground">
                                  {medProgress.taken} / {medProgress.total} doz alındı
                                </p>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all"
                                style={{ width: `${(medProgress.taken / medProgress.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
