// 🌸 Calendar Page
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { UpdateSheet } from '@/components/UpdateSheet';
import { useCycleData } from '@/hooks/useCycleData';
import type { DayEntry } from '@/types/cycle';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function CalendarPage() {
  const { 
    cycleSettings, 
    prediction, 
    entries, 
    saveDayEntry,
    userSettings 
  } = useCycleData();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  const getDayStyles = (type: ReturnType<typeof getDayType>, isToday: boolean, isCurrentMonth: boolean) => {
    let base = 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ';
    
    if (!isCurrentMonth) {
      base += 'text-muted-foreground/40 ';
    }
    
    if (isToday) {
      base += 'ring-2 ring-primary ring-offset-2 ring-offset-background ';
    }
    
    switch (type) {
      case 'period':
        return base + 'bg-period text-white';
      case 'predicted':
        return base + 'bg-period/30 text-period-dark';
      case 'fertile':
        return base + 'bg-fertile/30 text-fertile-dark';
      case 'ovulation':
        return base + 'bg-ovulation text-white';
      case 'pms':
        return base + 'bg-pms/30 text-orange-700';
      default:
        return base + (isCurrentMonth ? 'text-foreground hover:bg-muted' : '');
    }
  };

  const getEntryForDate = (date: Date): DayEntry | undefined => {
    return entries.find(e => e.date === format(date, 'yyyy-MM-dd'));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const handleSaveEntry = async (entry: DayEntry) => {
    await saveDayEntry(entry);
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <motion.h1 
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-foreground"
          >
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </motion.h1>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-period" />
            <span className="text-muted-foreground">Regl</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-period/30" />
            <span className="text-muted-foreground">Tahmini</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-fertile/50" />
            <span className="text-muted-foreground">Doğurgan</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-ovulation" />
            <span className="text-muted-foreground">Yumurtlama</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
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
              
              return (
                <motion.button
                  key={date.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => handleDayClick(date)}
                  className={`relative ${getDayStyles(dayType, isToday, isCurrentMonth)}`}
                >
                  {format(date, 'd')}
                  
                  {/* Entry indicator dots */}
                  {entry && (entry.symptoms.length > 0 || entry.mood) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 space-y-3"
          >
            <h3 className="text-sm font-medium text-muted-foreground">Yaklaşan</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-period-light rounded-xl">
                <div className="w-10 h-10 rounded-full bg-period/20 flex items-center justify-center">
                  <span>🌸</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Sonraki Regl</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(prediction.nextPeriodStart), 'd MMMM', { locale: tr })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-fertile-light rounded-xl">
                <div className="w-10 h-10 rounded-full bg-fertile/20 flex items-center justify-center">
                  <span>🥚</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Yumurtlama</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(prediction.ovulationDate), 'd MMMM', { locale: tr })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav />

      {/* Day Detail Sheet */}
      <UpdateSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={handleSaveEntry}
        existingEntry={selectedDate ? getEntryForDate(selectedDate) : undefined}
        date={selectedDate || new Date()}
        language={userSettings.language}
      />
    </div>
  );
}
