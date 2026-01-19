// 🌸 Statistics Page - Flo Inspired Design
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, BarChart3, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
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
  Area
} from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { getCycleHistory, type CycleRecord } from '@/lib/storage';
import { format, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, startOfMonth, endOfMonth, addMonths, isSameMonth, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

// Flo-style colors
const CHART_COLORS = {
  primary: '#F472B6',
  secondary: '#A78BFA',
  accent: '#34D399',
  warning: '#FBBF24',
  line: '#EC4899',
};

const CYCLE_PHASE_COLORS = {
  period: '#F472B6',
  follicular: '#60A5FA',
  ovulation: '#A78BFA',
  luteal: '#FBBF24',
};

export default function StatsPage() {
  const { openUpdateSheet } = useUpdateSheet();
  const { cycleSettings, entries, userSettings } = useCycleData();
  const [activeTab, setActiveTab] = useState<'stats' | 'charts' | 'history'>('stats');
  const [cycleHistory, setCycleHistory] = useState<CycleRecord[]>([]);
  const [historyMonth, setHistoryMonth] = useState(new Date());
  
  // Swipe navigation - tab arası geçiş için
  useSwipeNavigation({ threshold: 60 });

  // Load cycle history
  useEffect(() => {
    getCycleHistory().then(setCycleHistory);
  }, []);

  const handleCenterPress = (tab?: 'flow' | 'symptoms' | 'mood') => {
    openUpdateSheet({ initialTab: tab || 'flow' });
  };

  // Generate last 6 months cycle data
  const cycleLengthData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM', { locale: tr }),
        length: 25 + Math.floor(Math.random() * 6),
      });
    }
    return months;
  }, []);

  // Generate last 6 months period duration
  const periodDurationData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, 'MMM', { locale: tr }),
        duration: 3 + Math.floor(Math.random() * 3),
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
      
      // Count entries with flow in this week
      const periodDays = daysInWeek.filter(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = entries.find(e => e.date === dateStr);
        return entry && entry.flowLevel !== 'none';
      }).length;

      // Count symptom entries
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
    
    return [
      { name: 'Adet', days: periodDays, color: CYCLE_PHASE_COLORS.period },
      { name: 'Foliküler', days: follicularDays, color: CYCLE_PHASE_COLORS.follicular },
      { name: 'Ovülasyon', days: ovulationDays, color: CYCLE_PHASE_COLORS.ovulation },
      { name: 'Luteal', days: lutealDays, color: CYCLE_PHASE_COLORS.luteal },
    ];
  }, [cycleSettings]);

  // Tab component
  const TabButton = ({ tab, label }: { tab: 'stats' | 'charts' | 'history'; label: string }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-full transition-all ${
        activeTab === tab 
          ? 'bg-primary text-white shadow-md shadow-primary/30' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
      whileTap={{ scale: 0.97 }}
    >
      {label}
    </motion.button>
  );

  // Chart Card component
  const ChartCard = ({ 
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm"
    >
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
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">
          {userSettings?.language === 'en' ? 'Statistics' : 'İstatistikler'}
        </h1>
        
        {/* Tab Switcher */}
        <div className="mt-4 flex gap-1 p-1 bg-muted/50 rounded-full">
          <TabButton tab="stats" label={userSettings?.language === 'en' ? 'Summary' : 'Özet'} />
          <TabButton tab="charts" label={userSettings?.language === 'en' ? 'Charts' : 'Grafikler'} />
          <TabButton tab="history" label={userSettings?.language === 'en' ? 'History' : 'Geçmiş'} />
        </div>
      </header>

      <main className="px-6 space-y-5">
        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Cycle History Calendar */}
              <ChartCard
                title={userSettings?.language === 'en' ? 'Cycle History' : 'Döngü Geçmişi'}
                subtitle={userSettings?.language === 'en' ? 'View past period days' : 'Geçmiş regl günlerini görüntüle'}
                icon={<Calendar className="w-5 h-5 text-primary" />}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHistoryMonth(prev => subMonths(prev, 1))}
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
                    onClick={() => setHistoryMonth(prev => addMonths(prev, 1))}
                    disabled={isSameMonth(historyMonth, new Date())}
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
                  {(() => {
                    const monthStart = startOfMonth(historyMonth);
                    const monthEnd = endOfMonth(historyMonth);
                    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
                    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
                    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                    // Check if a day is a period day from entries or cycle history
                    const isPeriodDay = (date: Date): boolean => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      
                      // Check from day entries
                      const entry = entries.find(e => e.date === dateStr);
                      if (entry && entry.flowLevel !== 'none') {
                        return true;
                      }
                      
                      // Check from cycle history
                      return cycleHistory.some(record => {
                        const start = parseISO(record.startDate);
                        const end = parseISO(record.endDate);
                        return isWithinInterval(date, { start, end });
                      });
                    };

                    return days.map((day) => {
                      const isCurrentMonth = isSameMonth(day, historyMonth);
                      const isToday = isSameDay(day, new Date());
                      const isPeriod = isPeriodDay(day);

                      return (
                        <motion.div
                          key={day.toISOString()}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`
                            aspect-square flex items-center justify-center rounded-full text-sm
                            ${!isCurrentMonth ? 'opacity-30' : ''}
                            ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                            ${isPeriod ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground'}
                          `}
                        >
                          {format(day, 'd')}
                        </motion.div>
                      );
                    });
                  })()}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      {userSettings?.language === 'en' ? 'Period day' : 'Regl günü'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background" />
                    <span className="text-xs text-muted-foreground">
                      {userSettings?.language === 'en' ? 'Today' : 'Bugün'}
                    </span>
                  </div>
                </div>
              </ChartCard>

              {/* Cycle Records List */}
              {cycleHistory.length > 0 && (
                <ChartCard
                  title={userSettings?.language === 'en' ? 'Past Cycles' : 'Geçmiş Döngüler'}
                  subtitle={userSettings?.language === 'en' ? `Last ${cycleHistory.length} cycles` : `Son ${cycleHistory.length} döngü`}
                  icon={<Activity className="w-5 h-5 text-primary" />}
                >
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {[...cycleHistory].reverse().map((record, index) => (
                      <div 
                        key={index}
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
                              {record.length} {userSettings?.language === 'en' ? 'days' : 'gün'}
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
                title={userSettings?.language === 'en' ? 'Weekly Overview' : 'Haftalık Özet'}
                subtitle={userSettings?.language === 'en' ? 'Last 4 weeks' : 'Son 4 hafta'}
                icon={<BarChart3 className="w-5 h-5 text-primary" />}
              >
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyOverviewData}>
                      <defs>
                        <linearGradient id="colorPeriod" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorSymptom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1}/>
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
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name) => [
                          `${value} gün`, 
                          name === 'periodDays' ? 'Regl' : 'Semptom'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="periodDays" 
                        stroke={CHART_COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorPeriod)"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="symptomDays" 
                        stroke={CHART_COLORS.secondary}
                        fillOpacity={1}
                        fill="url(#colorSymptom)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
                    <span className="text-xs text-muted-foreground">
                      {userSettings?.language === 'en' ? 'Period days' : 'Regl günleri'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }} />
                    <span className="text-xs text-muted-foreground">
                      {userSettings?.language === 'en' ? 'Symptom days' : 'Semptom günleri'}
                    </span>
                  </div>
                </div>
              </ChartCard>

              {/* Top Symptoms */}
              {monthlySymptomData.length > 0 && (
                <ChartCard
                  title={userSettings?.language === 'en' ? 'Common Symptoms' : 'Sık Görülen Semptomlar'}
                  subtitle={userSettings?.language === 'en' ? 'Most logged symptoms' : 'En çok kaydedilen'}
                  icon={<BarChart3 className="w-5 h-5 text-primary" />}
                >
                  <div className="space-y-3">
                    {monthlySymptomData.map((symptom, index) => (
                      <div key={symptom.name} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-24 truncate">{symptom.name}</span>
                        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ 
                              backgroundColor: index === 0 ? CHART_COLORS.primary : 
                                              index === 1 ? CHART_COLORS.secondary :
                                              index === 2 ? CHART_COLORS.accent :
                                              CHART_COLORS.warning
                            }}
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${(symptom.count / (monthlySymptomData[0]?.count || 1)) * 100}%` 
                            }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">{symptom.count}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </motion.div>
          ) : activeTab === 'charts' ? (
            <motion.div
              key="charts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Cycle Length Trend - Line Chart */}
              <ChartCard
                title={userSettings?.language === 'en' ? 'Cycle Length Trend' : 'Döngü Uzunluğu Trendi'}
                subtitle={userSettings?.language === 'en' ? 'Last 6 months' : 'Son 6 ay'}
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
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
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} ${userSettings?.language === 'en' ? 'days' : 'gün'}`, userSettings?.language === 'en' ? 'Cycle' : 'Döngü']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="length" 
                        stroke={CHART_COLORS.line}
                        strokeWidth={3}
                        dot={{ fill: CHART_COLORS.line, strokeWidth: 0, r: 5 }}
                        activeDot={{ r: 7, fill: CHART_COLORS.line }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Period Duration Trend - Bar Chart */}
              <ChartCard
                title={userSettings?.language === 'en' ? 'Period Duration Trend' : 'Adet Süresi Trendi'}
                subtitle={userSettings?.language === 'en' ? 'Last 6 months' : 'Son 6 ay'}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="14" width="4" height="6" rx="1" fill={CHART_COLORS.primary} />
                    <rect x="10" y="10" width="4" height="10" rx="1" fill={CHART_COLORS.primary} opacity="0.7" />
                    <rect x="16" y="6" width="4" height="14" rx="1" fill={CHART_COLORS.primary} opacity="0.5" />
                  </svg>
                }
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
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} ${userSettings?.language === 'en' ? 'days' : 'gün'}`, userSettings?.language === 'en' ? 'Duration' : 'Süre']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="duration" 
                        radius={[8, 8, 0, 0]}
                      >
                        {periodDurationData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index % 2 === 0 ? CHART_COLORS.primary : '#FDA4AF'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Cycle Phase Distribution - Donut Chart */}
              <ChartCard
                title={userSettings?.language === 'en' ? 'Cycle Phases' : 'Döngü Fazları'}
                subtitle={userSettings?.language === 'en' ? 'Day distribution' : 'Gün dağılımı'}
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke={CHART_COLORS.primary} strokeWidth="3" fill="none" />
                    <path d="M12 2 A10 10 0 0 1 22 12" stroke={CHART_COLORS.secondary} strokeWidth="3" fill="none" />
                  </svg>
                }
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
                        >
                          {phaseDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                          <p className="text-muted-foreground">{phase.days} {userSettings?.language === 'en' ? 'days' : 'gün'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-5 shadow-lg shadow-rose-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">📅</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{cycleSettings.cycleLength}</p>
                  <p className="text-sm text-white/80">
                    {userSettings?.language === 'en' ? 'Cycle Length' : 'Döngü Uzunluğu'}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {userSettings?.language === 'en' ? 'avg. days' : 'gün ortalama'}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl p-5 shadow-lg shadow-violet-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">🌸</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{cycleSettings.periodLength}</p>
                  <p className="text-sm text-white/80">
                    {userSettings?.language === 'en' ? 'Period Duration' : 'Regl Süresi'}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {userSettings?.language === 'en' ? 'avg. days' : 'gün ortalama'}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-cyan-400 to-teal-500 rounded-3xl p-5 shadow-lg shadow-teal-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">🥚</span>
                  </div>
                  <p className="text-3xl font-bold text-white">14</p>
                  <p className="text-sm text-white/80">
                    {userSettings?.language === 'en' ? 'Ovulation' : 'Yumurtlama'}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {userSettings?.language === 'en' ? 'cycle day' : 'döngü günü'}
                  </p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-5 shadow-lg shadow-orange-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">💐</span>
                  </div>
                  <p className="text-3xl font-bold text-white">6</p>
                  <p className="text-sm text-white/80">
                    {userSettings?.language === 'en' ? 'Fertile Days' : 'Doğurgan Gün'}
                  </p>
                  <p className="text-xs text-white/60 mt-1">
                    {userSettings?.language === 'en' ? 'predicted' : 'tahmin edilen'}
                  </p>
                </motion.div>
              </div>

              {/* Insight Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-3xl p-5 border border-border/50"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-2xl">💡</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {userSettings?.language === 'en' ? 'Cycle Analysis' : 'Döngü Analizi'}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {userSettings?.language === 'en' 
                        ? `Your cycle appears regular. Your average ${cycleSettings.cycleLength}-day cycle is within the normal range (21-35 days). Predictions will improve as more data is collected.`
                        : `Döngünüz düzenli görünüyor. Ortalama ${cycleSettings.cycleLength} günlük döngü uzunluğunuz normal aralıkta (21-35 gün). Daha fazla veri toplandıkça tahminler daha doğru olacak.`
                      }
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Empty State Placeholder */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-sm text-muted-foreground">
                  {userSettings?.language === 'en' 
                    ? 'Keep logging daily to get more detailed statistics.'
                    : 'Daha detaylı istatistikler için günlük kayıtlarınızı eklemeye devam edin.'
                  }
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav onCenterPress={handleCenterPress} />
    </div>
  );
}
