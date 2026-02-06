// 🌸 Calendar Page - Flo Inspired Design with Medication Integration
import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { getMedicationLogsForDate, getMedications } from '@/lib/medicationStorage';
import { scheduleCustomReminder } from '@/lib/notifications';
import { FLOW_LABELS, SYMPTOM_LABELS, MOOD_LABELS } from '@/types/cycle';
import type { DayEntry } from '@/types/cycle';
import type { Medication, MedicationLog } from '@/types/medication';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// Skeleton Loader for Calendar
const CalendarSkeleton = () => (
  <div className="min-h-screen bg-background pb-24 safe-area-top animate-fade-in">
    {/* Header Skeleton */}
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="text-center space-y-2">
            <Skeleton className="h-7 w-24 mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
    </header>

    <main className="px-4 pt-2">
      {/* Calendar Grid Skeleton */}
      <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-4 border border-border/50 shadow-lg">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-8 mx-auto" />
          ))}
        </div>
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Upcoming Events Skeleton */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    </main>
  </div>
);

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
    userSettings,
    isLoading 
  } = useCycleData();
  
  // Enable swipe navigation between tabs
  useSwipeNavigation();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<Record<string, MedicationLog[]>>({});
  const [activeInfoCard, setActiveInfoCard] = useState<'period' | 'ovulation' | 'fertile' | null>(null);
  const [showPeriodConfirm, setShowPeriodConfirm] = useState(false);

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

  const handleLogPastPeriod = async () => {
    if (!selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingEntry = entries.find(e => e.date === dateStr);
    const isOnPeriod = existingEntry?.flowLevel !== 'none' && existingEntry?.flowLevel !== undefined;
    
    // Toggle period status
    const newEntry = {
      date: dateStr,
      flowLevel: isOnPeriod ? 'none' as const : 'medium' as const,
      symptoms: existingEntry?.symptoms || [],
      mood: existingEntry?.mood,
      notes: existingEntry?.notes,
    };
    
    await saveDayEntry(newEntry);
    setShowPeriodConfirm(false);
    toast.success(isOnPeriod 
      ? (userSettings?.language === 'tr' ? 'Regl kaydı kaldırıldı' : 'Period log removed')
      : (userSettings?.language === 'tr' ? 'Regl kaydedildi! Tahminler güncellendi.' : 'Period logged! Predictions updated.')
    );
  };

  const handleCenterPress = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  // Get day type label for detail card
  const getDayTypeLabel = (type: string | null): { label: string; color: string } => {
    switch (type) {
      case 'period': return { label: 'Regl Günü', color: 'from-rose to-pink' };
      case 'predicted': return { label: 'Tahmini Regl', color: 'from-rose to-pink' };
      case 'fertile': return { label: 'Doğurgan Dönem', color: 'from-cyan to-teal' };
      case 'ovulation': return { label: 'Yumurtlama Günü', color: 'from-violet to-purple' };
      case 'pms': return { label: 'PMS Dönemi', color: 'from-orange to-amber' };
      default: return { label: 'Normal Gün', color: 'from-muted to-muted' };
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <>
        <CalendarSkeleton />
        <BottomNav onCenterPress={handleCenterPress} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {format(currentMonth, 'MMMM', { locale: tr })}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(currentMonth, 'yyyy')}
              </p>
            </div>
            
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
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
                <button
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-sm font-medium transition-all
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}
                    ${dayType === 'period' ? 'bg-gradient-to-br from-rose to-pink text-white shadow-md shadow-rose/30' : ''}
                    ${dayType === 'predicted' ? 'bg-gradient-to-br from-rose/40 to-pink/40 text-rose dark:text-rose' : ''}
                    ${dayType === 'fertile' ? 'bg-gradient-to-br from-cyan/30 to-teal/30 text-teal dark:text-teal' : ''}
                    ${dayType === 'ovulation' ? 'bg-gradient-to-br from-violet to-purple text-white shadow-md shadow-violet/30' : ''}
                    ${dayType === 'pms' ? 'bg-gradient-to-br from-orange/30 to-amber/30 text-orange dark:text-orange' : ''}
                    ${!dayType && isCurrentMonth ? 'text-foreground hover:bg-muted/50' : ''}
                  `}
                >
                  <span>{format(date, 'd')}</span>
                  
                  {/* Entry indicator (bottom left) */}
                  {entry && (entry.symptoms.length > 0 || entry.mood) && (
                    <span className="absolute bottom-1 left-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  
                  {/* Medication indicator (bottom right) */}
                  {hasMedications && isCurrentMonth && (
                    <span 
                      className={`absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full ${
                        allMedsTaken 
                          ? 'bg-emerald' 
                          : someMedsTaken 
                            ? 'bg-amber' 
                            : 'bg-muted-foreground/30'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Medication Summary for Today */}
        {medications.length > 0 && (
          <div className="mt-4">
            <div className="bg-gradient-to-r from-violet/10 via-purple/10 to-pink/10 rounded-2xl p-4 border border-violet/30 dark:border-violet/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-purple flex items-center justify-center">
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
                <div
                  className="h-full bg-gradient-to-r from-violet to-purple rounded-full transition-all duration-500"
                  style={{ 
                    width: `${getMedicationProgress(new Date()).total > 0 
                      ? (getMedicationProgress(new Date()).taken / getMedicationProgress(new Date()).total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {prediction && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Yaklaşan Tarihler</h3>
            
            <div className="space-y-3">
              {/* Next Period Card */}
              <div 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose to-pink p-4 shadow-lg shadow-rose/20 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setActiveInfoCard('period')}
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
              </div>
              
              {/* Ovulation Card */}
              <div 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet to-purple p-4 shadow-lg shadow-violet/20 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setActiveInfoCard('ovulation')}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                      <circle cx="12" cy="12" r="5" fill="#a855f7" opacity="0.6" />
                      <circle cx="10" cy="10" r="2" fill="white" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Yumurtlama</p>
                    <p className="text-sm text-white/80">
                      {format(parseISO(prediction.ovulationDate), 'd MMMM EEEE', { locale: tr })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </div>

              {/* Fertile Window Card */}
              <div 
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan to-teal p-4 shadow-lg shadow-teal/20 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setActiveInfoCard('fertile')}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                      <path d="M12 21c-1.5-1.5-6-5-6-10a6 6 0 1 1 12 0c0 5-4.5 8.5-6 10z" fill="white" opacity="0.9" />
                      <path d="M12 18c-1-1-4-3.5-4-7a4 4 0 1 1 8 0c0 3.5-3 6-4 7z" fill="#14b8a6" opacity="0.5" />
                      <circle cx="10" cy="10" r="1.5" fill="white" opacity="0.8" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Doğurgan Dönem</p>
                    <p className="text-sm text-white/80">
                      {format(parseISO(prediction.fertileWindowStart), 'd MMM', { locale: tr })} - {format(parseISO(prediction.fertileWindowEnd), 'd MMM', { locale: tr })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>
          </div>
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
              {/* Close Button - Inside AnimatePresence for synchronized exit */}
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInfoCard(null);
                }}
                className="fixed top-24 right-8 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-[110] active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-x-4 top-20 bottom-20 z-[101] rounded-3xl p-6 pt-12 shadow-2xl overflow-y-auto backdrop-blur-xl"
                style={{
                  background: activeInfoCard === 'period' 
                    ? 'linear-gradient(to bottom right, rgba(244, 114, 182, 0.75), rgba(236, 72, 153, 0.75))' 
                    : activeInfoCard === 'ovulation' 
                    ? 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.75), rgba(168, 85, 247, 0.75))'
                    : 'linear-gradient(to bottom right, rgba(34, 211, 238, 0.75), rgba(20, 184, 166, 0.75))'
                }}
              >

                {/* Period Info */}
                {activeInfoCard === 'period' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">🌸</span>
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
                      <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                        <circle cx="12" cy="12" r="6" fill="#a855f7" opacity="0.6" />
                        <circle cx="9" cy="9" r="2.5" fill="white" opacity="0.8" />
                      </svg>
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
                        <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 22c-2-2-8-6.5-8-13a8 8 0 1 1 16 0c0 6.5-6 11-8 13z" fill="white" opacity="0.9" />
                          <path d="M12 18c-1.3-1.3-5-4.5-5-9a5 5 0 1 1 10 0c0 4.5-3.7 7.7-5 9z" fill="#14b8a6" opacity="0.5" />
                          <circle cx="10" cy="9" r="2" fill="white" opacity="0.8" />
                        </svg>
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
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOvulationDay ? 'bg-gradient-to-r from-violet to-purple' : 'bg-white/60'}`}
                                    style={{ width: `${chance}%` }}
                                  />
                                </div>
                                <div className={`w-10 text-right text-sm font-bold ${isOvulationDay ? 'text-white' : 'text-white/80'}`}>
                                  {chance}%
                                </div>
                                {isOvulationDay && (
                                  <span className="text-xs bg-violet/50 px-2 py-0.5 rounded-full text-white">
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
              className="fixed bottom-0 left-0 right-0 z-[101] rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden backdrop-blur-xl bg-glass"
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
                    <button
                      onClick={handleEditDay}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Edit3 className="w-5 h-5 text-primary" />
                    </button>
                    <button
                      onClick={() => setShowDayDetail(false)}
                      className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
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
                  const isPastDate = selectedDate < new Date() && !isSameDay(selectedDate, new Date());
                  const isOnPeriod = entry?.flowLevel !== 'none' && entry?.flowLevel !== undefined;
                  
                  if (!entry && getMedicationProgress(selectedDate).total === 0) {
                    return (
                      <div className="space-y-4">
                        {/* Quick Period Log for Past Dates */}
                        {isPastDate && (
                          <button
                            onClick={() => setShowPeriodConfirm(true)}
                            className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose to-pink text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-lg shadow-rose/30"
                          >
                            <span className="text-xl">🩸</span>
                            <span className="font-semibold">Bu Gün Regl Başladı</span>
                          </button>
                        )}
                        
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">Bu gün için kayıt yok</p>
                          <button
                            onClick={handleEditDay}
                            className="mt-3 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform"
                          >
                            Detaylı Kayıt Ekle
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Quick Period Toggle for Past Dates */}
                      {isPastDate && (
                        <button
                          onClick={() => setShowPeriodConfirm(true)}
                          className={`w-full p-3 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-lg ${
                            isOnPeriod 
                              ? 'bg-gradient-to-r from-emerald to-teal text-white shadow-emerald/30'
                              : 'bg-gradient-to-r from-rose to-pink text-white shadow-rose/30'
                          }`}
                        >
                          <span className="text-lg">{isOnPeriod ? '✓' : '🩸'}</span>
                          <span className="font-medium text-sm">
                            {isOnPeriod ? 'Regl Kaydını Kaldır' : 'Bu Gün Regl Başladı'}
                          </span>
                        </button>
                      )}
                      {/* Flow Level */}
                      {entry && entry.flowLevel !== 'none' && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-light dark:bg-rose/20">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose to-pink flex items-center justify-center">
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
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-light dark:bg-amber/20">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber to-orange flex items-center justify-center">
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
                        <div className="p-3 rounded-2xl bg-violet-light dark:bg-violet/20">
                          <p className="text-xs text-muted-foreground mb-2">Semptomlar</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.symptoms.map(symptom => {
                              const label = SYMPTOM_LABELS[symptom];
                              return (
                                <span
                                  key={symptom}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-light dark:bg-violet/30 text-xs font-medium text-violet dark:text-violet-light"
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
                        <div className="p-3 rounded-2xl bg-pink-light dark:bg-pink/20">
                          <p className="text-xs text-muted-foreground mb-2">Cinsel Aktivite</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.sexualActivity.map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-light dark:bg-pink/30 text-xs font-medium text-pink dark:text-pink-light"
                              >
                                💕 {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Discharge */}
                      {entry?.discharge && entry.discharge.length > 0 && (
                        <div className="p-3 rounded-2xl bg-violet-light dark:bg-violet/20">
                          <p className="text-xs text-muted-foreground mb-2">Vajinal Akıntı</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.discharge.map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-light dark:bg-violet/30 text-xs font-medium text-violet dark:text-violet-light"
                              >
                                💧 {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activity */}
                      {entry?.activity && entry.activity.length > 0 && (
                        <div className="p-3 rounded-2xl bg-green-light dark:bg-green/20">
                          <p className="text-xs text-muted-foreground mb-2">Fiziksel Aktivite</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.activity.map(item => (
                              <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-light dark:bg-green/30 text-xs font-medium text-green dark:text-green-light"
                              >
                                🏃 {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Water Intake */}
                      {entry?.waterGlasses && entry.waterGlasses > 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-light dark:bg-sky/20">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky to-blue flex items-center justify-center">
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
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-light dark:bg-slate/20">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate to-slate flex items-center justify-center">
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
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-light dark:bg-orange/20">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange to-amber flex items-center justify-center">
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
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-light dark:bg-teal/20">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-cyan flex items-center justify-center">
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
                          <div className="p-3 rounded-2xl bg-emerald/10 dark:bg-emerald/20">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald to-green flex items-center justify-center">
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
                                className="h-full bg-gradient-to-r from-emerald to-green rounded-full transition-all"
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

      {/* Period Confirmation Modal */}
      {showPeriodConfirm && selectedDate && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50 animate-fade-in"
            onClick={() => setShowPeriodConfirm(false)}
          />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl border border-border pointer-events-auto animate-scale-in"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose to-pink mx-auto flex items-center justify-center mb-3">
                  <span className="text-3xl">🩸</span>
                </div>
                <h3 className="font-bold text-lg text-foreground">
                  {format(selectedDate, 'd MMMM yyyy', { locale: tr })}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {(() => {
                    const entry = getEntryForDate(selectedDate);
                    const isOnPeriod = entry?.flowLevel !== 'none' && entry?.flowLevel !== undefined;
                    return isOnPeriod 
                      ? 'Bu günün regl kaydını kaldırmak istiyor musunuz?'
                      : 'Bu gün regl başladı olarak işaretlensin mi? Tahminler otomatik güncellenecek.';
                  })()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPeriodConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium active:scale-[0.98] transition-transform"
                >
                  İptal
                </button>
                <button
                  onClick={handleLogPastPeriod}
                  className={`flex-1 py-3 rounded-xl font-medium active:scale-[0.98] transition-transform ${
                    (() => {
                      const entry = getEntryForDate(selectedDate);
                      const isOnPeriod = entry?.flowLevel !== 'none' && entry?.flowLevel !== undefined;
                      return isOnPeriod 
                        ? 'bg-gradient-to-r from-emerald to-teal text-white'
                        : 'bg-gradient-to-r from-rose to-pink text-white';
                    })()
                  }`}
                >
                  {(() => {
                    const entry = getEntryForDate(selectedDate);
                    const isOnPeriod = entry?.flowLevel !== 'none' && entry?.flowLevel !== undefined;
                    return isOnPeriod ? 'Kaldır' : 'Onayla';
                  })()}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
