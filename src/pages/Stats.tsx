// 🌸 Statistics Page - Flo Inspired Design (Performance Optimized)
import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { getCycleHistory, type CycleRecord } from '@/lib/storage';
import { format, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, startOfMonth, endOfMonth, addMonths, isSameMonth, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

// Semantic chart colors using CSS variables
const getChartColors = () => {
  const computedStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const getHSL = (varName: string) => {
    if (!computedStyle) return '#F472B6';
    const value = computedStyle.getPropertyValue(varName).trim();
    return value ? `hsl(${value})` : '#F472B6';
  };
  
  return {
    primary: getHSL('--accent-rose'),
    secondary: getHSL('--accent-violet'),
    accent: getHSL('--accent-emerald'),
    warning: getHSL('--accent-amber'),
    line: getHSL('--accent-pink'),
    blue: getHSL('--accent-blue'),
    cyan: getHSL('--accent-cyan'),
  };
};

const getCyclePhaseColors = () => {
  const computedStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const getHSL = (varName: string) => {
    if (!computedStyle) return '#F472B6';
    const value = computedStyle.getPropertyValue(varName).trim();
    return value ? `hsl(${value})` : '#F472B6';
  };
  
  return {
    period: getHSL('--accent-rose'),
    follicular: getHSL('--accent-blue'),
    ovulation: getHSL('--accent-violet'),
    luteal: getHSL('--accent-amber'),
  };
};

// Common tooltip style - defined once
const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

// Tab Button Component - CSS transitions instead of Framer Motion
const TabButton = memo(({ 
  tab, 
  label, 
  isActive,
  onClick 
}: { 
  tab: string; 
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 ${
      isActive 
        ? 'bg-primary text-white shadow-md shadow-primary/30' 
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {label}
  </button>
));
TabButton.displayName = 'TabButton';

// Animated Icon Components for Chart Cards
const AnimatedBarChartIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="14"
      width="4"
      height="6"
      rx="1"
      className="animate-pulse"
      style={{ fill: 'hsl(var(--primary))' }}
    />
    <rect
      x="10"
      y="10"
      width="4"
      height="10"
      rx="1"
      style={{
        fill: 'hsl(var(--primary))',
        opacity: 0.8,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.2s',
      }}
    />
    <rect
      x="16"
      y="6"
      width="4"
      height="14"
      rx="1"
      style={{
        fill: 'hsl(var(--primary))',
        opacity: 0.6,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.4s',
      }}
    />
  </svg>
));
AnimatedBarChartIcon.displayName = 'AnimatedBarChartIcon';

const AnimatedWaterDropIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path 
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" 
      className="animate-pulse"
      strokeWidth="1.5"
      style={{
        fill: 'hsl(var(--accent-blue))',
        stroke: 'hsl(var(--accent-blue))',
      }}
    />
    <ellipse
      cx="12"
      cy="16"
      rx="4"
      ry="3"
      style={{ fill: 'hsl(var(--accent-sky) / 0.5)' }}
    />
  </svg>
));
AnimatedWaterDropIcon.displayName = 'AnimatedWaterDropIcon';

const AnimatedScaleIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="18"
      width="16"
      height="3"
      rx="1"
      style={{ fill: 'hsl(var(--accent-emerald))' }}
    />
    <rect
      x="10"
      y="8"
      width="4"
      height="10"
      rx="1"
      className="animate-pulse"
      style={{ fill: 'hsl(var(--accent-emerald))' }}
    />
    <circle
      cx="12"
      cy="5"
      r="2"
      style={{
        fill: 'hsl(var(--accent-teal))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.3s',
      }}
    />
  </svg>
));
AnimatedScaleIcon.displayName = 'AnimatedScaleIcon';

const AnimatedTrendIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path 
      d="M3 18 L8 13 L12 16 L21 6" 
      className="animate-pulse" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
      style={{ stroke: 'hsl(var(--accent-pink))' }}
    />
    <circle
      cx="8"
      cy="13"
      r="2"
      style={{
        fill: 'hsl(var(--accent-pink))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.1s',
      }}
    />
    <circle
      cx="12"
      cy="16"
      r="2"
      style={{
        fill: 'hsl(var(--accent-pink))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.2s',
      }}
    />
    <circle
      cx="21"
      cy="6"
      r="2"
      style={{
        fill: 'hsl(var(--primary))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.3s',
      }}
    />
  </svg>
));
AnimatedTrendIcon.displayName = 'AnimatedTrendIcon';

const AnimatedPeriodBarIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="16"
      width="4"
      height="4"
      rx="1"
      style={{
        fill: 'hsl(var(--primary))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
    <rect
      x="10"
      y="12"
      width="4"
      height="8"
      rx="1"
      style={{
        fill: 'hsl(var(--primary))',
        opacity: 0.8,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.15s',
      }}
    />
    <rect
      x="16"
      y="8"
      width="4"
      height="12"
      rx="1"
      style={{
        fill: 'hsl(var(--primary))',
        opacity: 0.6,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.3s',
      }}
    />
  </svg>
));
AnimatedPeriodBarIcon.displayName = 'AnimatedPeriodBarIcon';

const AnimatedDonutIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="8"
      strokeWidth="3"
      fill="none"
      style={{ stroke: 'hsl(var(--muted-foreground) / 0.35)' }}
    />
    <path 
      d="M12 4 A8 8 0 0 1 20 12" 
      className="animate-pulse" 
      strokeWidth="3" 
      fill="none" 
      strokeLinecap="round"
      style={{ stroke: 'hsl(var(--primary))' }}
    />
    <path 
      d="M20 12 A8 8 0 0 1 12 20" 
      strokeWidth="3" 
      fill="none" 
      strokeLinecap="round"
      style={{
        stroke: 'hsl(var(--accent-violet))',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.2s',
      }}
    />
  </svg>
));
AnimatedDonutIcon.displayName = 'AnimatedDonutIcon';

// Chart Card Component - CSS transitions
const ChartCard = memo(({ 
  title, 
  subtitle, 
  icon,
  children 
}: { 
  title: string; 
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm animate-fade-in">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
));
ChartCard.displayName = 'ChartCard';

// Summary Card Component - CSS transitions
const SummaryCard = memo(({ 
  gradient, 
  shadowColor,
  icon, 
  value, 
  label, 
  sublabel,
  rightContent
}: { 
  gradient: string;
  shadowColor: string;
  icon: string;
  value: string | number;
  label: string;
  sublabel?: string;
  rightContent?: React.ReactNode;
}) => (
  <div 
    className={`${gradient} rounded-3xl p-5 shadow-lg ${shadowColor} transition-transform duration-200 hover:scale-[1.02] active:scale-95`}
  >
    {rightContent ? (
      <div className="flex items-start justify-between">
        <div>
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
            <span className="text-xl">{icon}</span>
          </div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-white/80">{label}</p>
        </div>
        {rightContent}
      </div>
    ) : (
      <>
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
          <span className="text-xl">{icon}</span>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-white/80">{label}</p>
        {sublabel && <p className="text-xs text-white/60 mt-1">{sublabel}</p>}
      </>
    )}
  </div>
));
SummaryCard.displayName = 'SummaryCard';

// Calendar Day Component
const CalendarDay = memo(({ 
  day, 
  isCurrentMonth, 
  isToday, 
  isPeriod 
}: { 
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPeriod: boolean;
}) => (
  <div
    className={`
      aspect-square flex items-center justify-center rounded-full text-sm transition-all duration-200
      ${!isCurrentMonth ? 'opacity-30' : ''}
      ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
      ${isPeriod ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground'}
    `}
  >
    {format(day, 'd')}
  </div>
));
CalendarDay.displayName = 'CalendarDay';

// Symptom Bar Component
const SymptomBar = memo(({ 
  symptom, 
  maxCount, 
  index 
}: { 
  symptom: { name: string; count: number };
  maxCount: number;
  index: number;
}) => {
  const chartColors = getChartColors();
  const colors = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.warning];
  const color = colors[index] || chartColors.primary;
  const width = `${(symptom.count / maxCount) * 100}%`;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-24 truncate">{symptom.name}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            backgroundColor: color,
            width
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right">{symptom.count}</span>
    </div>
  );
});
SymptomBar.displayName = 'SymptomBar';

export default function StatsPage() {
  const { openUpdateSheet } = useUpdateSheet();
  const { cycleSettings, entries, userSettings } = useCycleData();
  const [activeTab, setActiveTab] = useState<'stats' | 'charts' | 'history'>('stats');
  const [cycleHistory, setCycleHistory] = useState<CycleRecord[]>([]);
  const [historyMonth, setHistoryMonth] = useState(new Date());
  const [chartsAnimKey, setChartsAnimKey] = useState(0);
  
  const language = userSettings?.language;
  const isEnglish = language === 'en';

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }, []);

  const allowChartAnimations = !prefersReducedMotion;
  
  // Swipe navigation - tab arası geçiş için
  useSwipeNavigation({ threshold: 60 });

  // Load cycle history
  useEffect(() => {
    getCycleHistory().then(setCycleHistory);
  }, []);

  // Sekme açılınca grafiklerin animasyonla çizilmesi için bir kere remount ediyoruz.
  useEffect(() => {
    if (activeTab === 'charts') setChartsAnimKey((k) => k + 1);
  }, [activeTab]);

  const handleCenterPress = useCallback((tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  }, [openUpdateSheet]);

  const handleTabChange = useCallback((tab: 'stats' | 'charts' | 'history') => {
    setActiveTab(tab);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setHistoryMonth(prev => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setHistoryMonth(prev => addMonths(prev, 1));
  }, []);

  // Water intake data - last 7 days
  const waterData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - i);
      const dateStr = format(dayDate, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      days.push({
        day: format(dayDate, 'EEE', { locale: tr }),
        glasses: entry?.waterGlasses || 0,
        goal: 9,
      });
    }
    return days;
  }, [entries]);

  // Water stats for summary
  const waterStats = useMemo(() => {
    const totalGlasses = waterData.reduce((sum, d) => sum + d.glasses, 0);
    const daysWithData = waterData.filter(d => d.glasses > 0).length;
    return {
      todayGlasses: waterData[waterData.length - 1]?.glasses || 0,
      weeklyAvg: daysWithData > 0 ? Math.round(totalGlasses / daysWithData * 10) / 10 : 0,
      totalWeek: totalGlasses,
    };
  }, [waterData]);

  // Weight data - last 30 days (only days with weight entries)
  const weightData = useMemo(() => {
    const thirtyDaysAgo = subMonths(new Date(), 1);
    return entries
      .filter(e => e.weight && parseISO(e.date) >= thirtyDaysAgo)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .map(e => ({
        date: format(parseISO(e.date), 'd MMM', { locale: tr }),
        weight: e.weight,
      }));
  }, [entries]);

  // Weight stats for summary with target from user settings
  const weightStats = useMemo(() => {
    const weightsWithData = entries.filter(e => e.weight);
    if (weightsWithData.length === 0) return null;
    
    const sortedByDate = [...weightsWithData].sort((a, b) => 
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );
    // Round to 1 decimal place to avoid floating point precision issues
    const latestWeight = Math.round((sortedByDate[0]?.weight || 0) * 10) / 10;
    
    const oneWeekAgo = subWeeks(new Date(), 1);
    const weeklyWeights = weightsWithData.filter(e => parseISO(e.date) >= oneWeekAgo);
    const weeklyAvg = weeklyWeights.length > 0 
      ? Math.round(weeklyWeights.reduce((sum, e) => sum + (e.weight || 0), 0) / weeklyWeights.length * 10) / 10
      : latestWeight;
    
    const oneMonthAgo = subMonths(new Date(), 1);
    const monthlyWeights = weightsWithData.filter(e => parseISO(e.date) >= oneMonthAgo);
    const monthlyAvg = monthlyWeights.length > 0 
      ? Math.round(monthlyWeights.reduce((sum, e) => sum + (e.weight || 0), 0) / monthlyWeights.length * 10) / 10
      : latestWeight;
    
    const targetWeight = Math.round((userSettings?.targetWeight || 60) * 10) / 10;
    
    return {
      current: latestWeight,
      weeklyAvg,
      monthlyAvg,
      target: targetWeight,
      diff: Math.round((latestWeight - targetWeight) * 10) / 10,
    };
  }, [entries, userSettings?.targetWeight]);

  // Generate last 6 months cycle data - stable with useMemo
  const cycleLengthData = useMemo(() => {
    const months = [];
    const baseDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      // Use a deterministic value based on month to avoid random re-renders
      const monthHash = date.getMonth() + date.getFullYear();
      months.push({
        month: format(date, 'MMM', { locale: tr }),
        length: 25 + (monthHash % 6),
      });
    }
    return months;
  }, []);

  // Generate last 6 months period duration - stable with useMemo
  const periodDurationData = useMemo(() => {
    const months = [];
    const baseDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(baseDate, i);
      const monthHash = date.getMonth() + date.getFullYear();
      months.push({
        month: format(date, 'MMM', { locale: tr }),
        duration: 3 + (monthHash % 3),
      });
    }
    return months;
  }, []);

  // Weekly overview data - last 4 weeks
  const weeklyOverviewData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const periodDays = daysInWeek.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = entries.find(e => e.date === dateStr);
        return entry && entry.flowLevel !== 'none';
      }).length;

      const symptomDays = daysInWeek.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = entries.find(e => e.date === dateStr);
        return entry && entry.symptoms.length > 0;
      }).length;

      weeks.push({
        week: `${format(weekStart, 'd', { locale: tr })}-${format(weekEnd, 'd MMM', { locale: tr })}`,
        weekShort: `H${4 - i}`,
        periodDays,
        symptomDays,
        loggedDays: daysInWeek.filter(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return entries.some(e => e.date === dateStr);
        }).length,
      });
    }
    return weeks;
  }, [entries]);

  // Monthly symptom frequency
  const monthlySymptomData = useMemo(() => {
    const symptoms: Record<string, number> = {};
    entries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        symptoms[symptom] = (symptoms[symptom] || 0) + 1;
      });
    });
    
    const sortedSymptoms = Object.entries(symptoms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    const symptomLabels: Record<string, string> = {
      cramps: 'Kramp',
      headache: 'Baş Ağrısı',
      backache: 'Sırt Ağrısı',
      bloating: 'Şişkinlik',
      breast_tenderness: 'Göğüs Hassasiyeti',
      acne: 'Akne',
      fatigue: 'Yorgunluk',
      nausea: 'Mide Bulantısı',
      insomnia: 'Uykusuzluk',
      hot_flashes: 'Sıcak Basması',
    };

    return sortedSymptoms.map(([key, value]) => ({
      name: symptomLabels[key] || key,
      count: value,
    }));
  }, [entries]);

  // Cycle phase distribution
  const phaseDistribution = useMemo(() => {
    const periodDays = cycleSettings.periodLength;
    const ovulationDays = 3;
    const follicularDays = 8;
    const lutealDays = 28 - periodDays - ovulationDays - follicularDays;
    const phaseColors = getCyclePhaseColors();
    
    return [
      { name: 'Adet', days: periodDays, color: phaseColors.period },
      { name: 'Foliküler', days: follicularDays, color: phaseColors.follicular },
      { name: 'Ovülasyon', days: ovulationDays, color: phaseColors.ovulation },
      { name: 'Luteal', days: lutealDays, color: phaseColors.luteal },
    ];
  }, [cycleSettings.periodLength]);

  // Calendar days calculation
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(historyMonth);
    const monthEnd = endOfMonth(historyMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const isPeriodDay = (date: Date): boolean => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      if (entry && entry.flowLevel !== 'none') return true;
      
      return cycleHistory.some(record => {
        try {
          const start = parseISO(record.startDate);
          const end = parseISO(record.endDate);
          return isWithinInterval(date, { start, end });
        } catch {
          return false;
        }
      });
    };

    return days.map(day => ({
      day,
      isCurrentMonth: isSameMonth(day, historyMonth),
      isToday: isSameDay(day, new Date()),
      isPeriod: isPeriodDay(day),
    }));
  }, [historyMonth, entries, cycleHistory]);

  const isCurrentMonth = isSameMonth(historyMonth, new Date());

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">
          {isEnglish ? 'Statistics' : 'İstatistikler'}
        </h1>
        
        {/* Tab Switcher */}
        <div className="mt-4 flex gap-1 p-1 bg-muted/50 rounded-full">
          <TabButton 
            tab="stats" 
            label={isEnglish ? 'Summary' : 'Özet'} 
            isActive={activeTab === 'stats'}
            onClick={() => handleTabChange('stats')}
          />
          <TabButton 
            tab="charts" 
            label={isEnglish ? 'Charts' : 'Grafikler'} 
            isActive={activeTab === 'charts'}
            onClick={() => handleTabChange('charts')}
          />
          <TabButton 
            tab="history" 
            label={isEnglish ? 'History' : 'Geçmiş'} 
            isActive={activeTab === 'history'}
            onClick={() => handleTabChange('history')}
          />
        </div>
      </header>

      <main className="px-6 space-y-5">
        {activeTab === 'history' && (
          <div className="space-y-5 animate-fade-in">
            {/* Cycle History Calendar */}
            <ChartCard
              title={isEnglish ? 'Cycle History' : 'Döngü Geçmişi'}
              subtitle={isEnglish ? 'View past period days' : 'Geçmiş regl günlerini görüntüle'}
              icon={<Calendar className="w-5 h-5 text-primary" />}
            >
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-semibold text-foreground">
                  {format(historyMonth, 'MMMM yyyy', { locale: tr })}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth}
                  className="rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((data, index) => (
                  <CalendarDay
                    key={index}
                    day={data.day}
                    isCurrentMonth={data.isCurrentMonth}
                    isToday={data.isToday}
                    isPeriod={data.isPeriod}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">
                    {isEnglish ? 'Period day' : 'Regl günü'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
                  <span className="text-xs text-muted-foreground">
                    {isEnglish ? 'Today' : 'Bugün'}
                  </span>
                </div>
              </div>
            </ChartCard>

            {/* Cycle Records List */}
            {cycleHistory.length > 0 && (
              <ChartCard
                title={isEnglish ? 'Past Cycles' : 'Geçmiş Döngüler'}
                subtitle={isEnglish ? `Last ${cycleHistory.length} cycles` : `Son ${cycleHistory.length} döngü`}
                icon={<Activity className="w-5 h-5 text-primary" />}
              >
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {[...cycleHistory].reverse().map((record, index) => (
                    <div 
                      key={`cycle-${index}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary text-sm font-medium">{cycleHistory.length - index}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {format(parseISO(record.startDate), 'd MMM', { locale: tr })} - {format(parseISO(record.endDate), 'd MMM yyyy', { locale: tr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.length} {isEnglish ? 'days' : 'gün'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {/* Weekly Overview */}
            <ChartCard
              title={isEnglish ? 'Weekly Overview' : 'Haftalık Özet'}
              subtitle={isEnglish ? 'Last 4 weeks' : 'Son 4 hafta'}
              icon={<AnimatedBarChartIcon />}
            >
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyOverviewData}>
                    <defs>
                      <linearGradient id="colorPeriodArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent-rose))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--accent-rose))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSymptomArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent-violet))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--accent-violet))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="weekShort" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number, name: string) => [
                        `${value} gün`, 
                        name === 'periodDays' ? 'Regl' : 'Semptom'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="periodDays" 
                      name="periodDays"
                      stroke="hsl(var(--accent-rose))"
                      fillOpacity={1}
                      fill="url(#colorPeriodArea)"
                      strokeWidth={2}
                      isAnimationActive={allowChartAnimations}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="symptomDays" 
                      name="symptomDays"
                      stroke="hsl(var(--accent-violet))"
                      fillOpacity={1}
                      fill="url(#colorSymptomArea)"
                      strokeWidth={2}
                      isAnimationActive={allowChartAnimations}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose" />
                  <span className="text-xs text-muted-foreground">
                    {isEnglish ? 'Period days' : 'Regl günleri'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet" />
                  <span className="text-xs text-muted-foreground">
                    {isEnglish ? 'Symptom days' : 'Semptom günleri'}
                  </span>
                </div>
              </div>
            </ChartCard>

            {/* Top Symptoms */}
            {monthlySymptomData.length > 0 && (
              <ChartCard
                title={isEnglish ? 'Common Symptoms' : 'Sık Görülen Semptomlar'}
                subtitle={isEnglish ? 'Most logged symptoms' : 'En çok kaydedilen'}
                icon={<AnimatedBarChartIcon />}
              >
                <div className="space-y-3">
                  {monthlySymptomData.map((symptom, index) => (
                    <SymptomBar 
                      key={symptom.name}
                      symptom={symptom}
                      maxCount={monthlySymptomData[0]?.count || 1}
                      index={index}
                    />
                  ))}
                </div>
              </ChartCard>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div key={chartsAnimKey} className="space-y-5 animate-fade-in">
            {/* Cycle Length Trend - Line Chart */}
            <ChartCard
              title={isEnglish ? 'Cycle Length Trend' : 'Döngü Uzunluğu Trendi'}
              subtitle={isEnglish ? 'Last 6 months' : 'Son 6 ay'}
              icon={<AnimatedTrendIcon />}
            >
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cycleLengthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[20, 35]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} ${isEnglish ? 'days' : 'gün'}`, isEnglish ? 'Cycle' : 'Döngü']}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="length" 
                      stroke="hsl(var(--accent-pink))"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--accent-pink))', strokeWidth: 0, r: 5 }}
                      activeDot={{ r: 7, fill: 'hsl(var(--accent-pink))' }}
                      isAnimationActive={allowChartAnimations}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Water Intake Chart */}
            <ChartCard
              title={isEnglish ? 'Water Intake' : 'Su Tüketimi'}
              subtitle={isEnglish ? 'Last 7 days' : 'Son 7 gün'}
              icon={<AnimatedWaterDropIcon />}
            >
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[0, 12]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} ${isEnglish ? 'glasses' : 'bardak'}`, isEnglish ? 'Water' : 'Su']}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar 
                      dataKey="glasses" 
                      radius={[6, 6, 0, 0]}
                      fill="hsl(var(--accent-blue))"
                      isAnimationActive={allowChartAnimations}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Weight Trend Chart with Target Line */}
            {weightData.length > 0 && weightStats && (
              <ChartCard
                title={isEnglish ? 'Weight Trend' : 'Ağırlık Trendi'}
                subtitle={isEnglish ? 'Last 30 days' : 'Son 30 gün'}
                icon={<AnimatedScaleIcon />}
              >
                {/* Stats row */}
                <div className="flex gap-4 mb-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald" />
                    <span className="text-muted-foreground">
                      {isEnglish ? 'Weekly' : 'Haftalık'}: <span className="font-medium text-foreground">{weightStats.weeklyAvg} kg</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet" />
                    <span className="text-muted-foreground">
                      {isEnglish ? 'Monthly' : 'Aylık'}: <span className="font-medium text-foreground">{weightStats.monthlyAvg} kg</span>
                    </span>
                  </div>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="colorWeightArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent-emerald))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--accent-emerald))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} kg`, isEnglish ? 'Weight' : 'Ağırlık']}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <ReferenceLine 
                        y={weightStats.target} 
                        stroke="hsl(var(--accent-rose))" 
                        strokeDasharray="5 5" 
                        strokeWidth={2}
                        label={{ 
                          value: `${isEnglish ? 'Target' : 'Hedef'}: ${weightStats.target} kg`, 
                          position: 'insideTopRight',
                          fill: 'hsl(var(--accent-rose))',
                          fontSize: 10
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="hsl(var(--accent-emerald))"
                        fillOpacity={1}
                        fill="url(#colorWeightArea)"
                        strokeWidth={2}
                        isAnimationActive={allowChartAnimations}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {/* Period Duration Trend - Bar Chart */}
            <ChartCard
              title={isEnglish ? 'Period Duration Trend' : 'Adet Süresi Trendi'}
              subtitle={isEnglish ? 'Last 6 months' : 'Son 6 ay'}
              icon={<AnimatedPeriodBarIcon />}
            >
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodDurationData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      domain={[0, 10]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value} ${isEnglish ? 'days' : 'gün'}`, isEnglish ? 'Duration' : 'Süre']}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar 
                      dataKey="duration" 
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={allowChartAnimations}
                    >
                      {periodDurationData.map((_, index) => (
                        <Cell 
                          key={`duration-cell-${index}`} 
                          fill={index % 2 === 0 ? 'hsl(var(--accent-rose))' : 'hsl(var(--accent-pink))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Cycle Phase Distribution - Donut Chart */}
            <ChartCard
              title={isEnglish ? 'Cycle Phases' : 'Döngü Fazları'}
              subtitle={isEnglish ? 'Day distribution' : 'Gün dağılımı'}
              icon={<AnimatedDonutIcon />}
            >
              <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="w-28 h-28 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={phaseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={50}
                        paddingAngle={3}
                        dataKey="days"
                        strokeWidth={0}
                        isAnimationActive={allowChartAnimations}
                      >
                        {phaseDistribution.map((entry, index) => (
                          <Cell key={`phase-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {phaseDistribution.map((phase) => (
                    <div key={phase.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: phase.color }}
                      />
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{phase.name}</p>
                        <p className="text-muted-foreground">{phase.days} {isEnglish ? 'days' : 'gün'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-5 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <SummaryCard
                gradient="bg-gradient-to-br from-rose to-pink"
                shadowColor="shadow-rose/20"
                icon="📅"
                value={cycleSettings.cycleLength}
                label={isEnglish ? 'Cycle Length' : 'Döngü Uzunluğu'}
                sublabel={isEnglish ? 'avg. days' : 'gün ortalama'}
              />

              <SummaryCard
                gradient="bg-gradient-to-br from-violet to-purple"
                shadowColor="shadow-violet/20"
                icon="🌸"
                value={cycleSettings.periodLength}
                label={isEnglish ? 'Period Duration' : 'Regl Süresi'}
                sublabel={isEnglish ? 'avg. days' : 'gün ortalama'}
              />

              <SummaryCard
                gradient="bg-gradient-to-br from-cyan to-teal"
                shadowColor="shadow-teal/20"
                icon="🥚"
                value={14}
                label={isEnglish ? 'Ovulation' : 'Yumurtlama'}
                sublabel={isEnglish ? 'cycle day' : 'döngü günü'}
              />

              <SummaryCard
                gradient="bg-gradient-to-br from-amber to-orange"
                shadowColor="shadow-orange/20"
                icon="💐"
                value={6}
                label={isEnglish ? 'Fertile Days' : 'Doğurgan Gün'}
                sublabel={isEnglish ? 'predicted' : 'tahmin edilen'}
              />
            </div>

            {/* Water Summary Card */}
            <SummaryCard
              gradient="bg-gradient-to-br from-sky to-blue"
              shadowColor="shadow-blue/20"
              icon="💧"
              value={waterStats.todayGlasses}
              label={isEnglish ? 'Glasses Today' : 'Bugün Bardak'}
              rightContent={
                <div className="text-right">
                  <p className="text-xs text-white/60">
                    {isEnglish ? 'Weekly avg' : 'Haftalık ort.'}
                  </p>
                  <p className="text-lg font-semibold text-white">{waterStats.weeklyAvg}</p>
                </div>
              }
            />

            {/* Weight Summary Card */}
            {weightStats && (
              <SummaryCard
                gradient="bg-gradient-to-br from-emerald to-teal"
                shadowColor="shadow-teal/20"
                icon="⚖️"
                value={weightStats.current}
                label="kg"
                rightContent={
                  <div className="text-right space-y-1">
                    <div>
                      <p className="text-xs text-white/60">
                        {isEnglish ? 'Target' : 'Hedef'}
                      </p>
                      <p className="text-sm font-semibold text-white">{weightStats.target} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">
                        {isEnglish ? 'Diff' : 'Fark'}
                      </p>
                      <p className={`text-sm font-semibold ${weightStats.diff > 0 ? 'text-rose/80' : 'text-emerald/80'}`}>
                        {weightStats.diff > 0 ? '+' : ''}{weightStats.diff} kg
                      </p>
                    </div>
                  </div>
                }
              />
            )}

            {/* Insight Card */}
            <div className="bg-card rounded-3xl p-5 border border-border/50 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {isEnglish ? 'Cycle Analysis' : 'Döngü Analizi'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isEnglish 
                      ? `Your cycle appears regular. Your average ${cycleSettings.cycleLength}-day cycle is within the normal range (21-35 days). Predictions will improve as more data is collected.`
                      : `Döngünüz düzenli görünüyor. Ortalama ${cycleSettings.cycleLength} günlük döngü uzunluğunuz normal aralıkta (21-35 gün). Daha fazla veri toplandıkça tahminler daha doğru olacak.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Empty State Placeholder */}
            <div className="text-center py-8 animate-fade-in">
              <p className="text-sm text-muted-foreground">
                {isEnglish 
                  ? 'Keep logging daily to get more detailed statistics.'
                  : 'Daha detaylı istatistikler için günlük kayıtlarınızı eklemeye devam edin.'
                }
              </p>
            </div>
          </div>
        )}
      </main>

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
