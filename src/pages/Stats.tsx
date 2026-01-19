// 🌸 Statistics Page - Flo Inspired Design
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
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
  CartesianGrid
} from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';

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
  const { cycleSettings } = useCycleData();
  const [activeTab, setActiveTab] = useState<'stats' | 'charts'>('stats');

  // Mock data for cycle length trend (last 6 months)
  const cycleLengthData = useMemo(() => {
    const months = ['Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca'];
    return months.map((month, index) => ({
      month,
      length: 25 + Math.floor(Math.random() * 6), // 25-30 range
    }));
  }, []);

  // Mock data for period duration trend
  const periodDurationData = useMemo(() => {
    const months = ['Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca'];
    return months.map((month) => ({
      month,
      duration: 3 + Math.floor(Math.random() * 3), // 3-5 range
    }));
  }, []);

  // Cycle phase distribution (based on typical 28-day cycle)
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
  const TabButton = ({ tab, label }: { tab: 'stats' | 'charts'; label: string }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 px-4 text-sm font-semibold rounded-full transition-all ${
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
        <h1 className="text-2xl font-bold text-foreground">İstatistikler</h1>
        
        {/* Tab Switcher */}
        <div className="mt-4 flex gap-2 p-1 bg-muted/50 rounded-full">
          <TabButton tab="stats" label="İstatistikler" />
          <TabButton tab="charts" label="Grafikler" />
        </div>
      </header>

      <main className="px-6 space-y-5">
        <AnimatePresence mode="wait">
          {activeTab === 'charts' ? (
            <motion.div
              key="charts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Cycle Length Trend - Line Chart */}
              <ChartCard
                title="Döngü Uzunluğu Trendi"
                subtitle="Son 6 ay"
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
                        formatter={(value) => [`${value} gün`, 'Döngü']}
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
                title="Adet Süresi Trendi"
                subtitle="Son 6 ay"
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
                        formatter={(value) => [`${value} gün`, 'Süre']}
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
                title="Döngü Fazları"
                subtitle="Gün dağılımı"
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
                          <p className="text-muted-foreground">{phase.days} gün</p>
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
                  <p className="text-sm text-white/80">Döngü Uzunluğu</p>
                  <p className="text-xs text-white/60 mt-1">gün ortalama</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-violet-400 to-purple-500 rounded-3xl p-5 shadow-lg shadow-violet-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">🌸</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{cycleSettings.periodLength}</p>
                  <p className="text-sm text-white/80">Regl Süresi</p>
                  <p className="text-xs text-white/60 mt-1">gün ortalama</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-cyan-400 to-teal-500 rounded-3xl p-5 shadow-lg shadow-teal-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">🥚</span>
                  </div>
                  <p className="text-3xl font-bold text-white">14</p>
                  <p className="text-sm text-white/80">Yumurtlama</p>
                  <p className="text-xs text-white/60 mt-1">döngü günü</p>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-5 shadow-lg shadow-orange-500/20"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                    <span className="text-xl">💐</span>
                  </div>
                  <p className="text-3xl font-bold text-white">6</p>
                  <p className="text-sm text-white/80">Doğurgan Gün</p>
                  <p className="text-xs text-white/60 mt-1">tahmin edilen</p>
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
                    <h3 className="font-semibold text-foreground mb-1">Döngü Analizi</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Döngünüz düzenli görünüyor. Ortalama {cycleSettings.cycleLength} günlük döngü uzunluğunuz 
                      normal aralıkta (21-35 gün). Daha fazla veri toplandıkça tahminler daha doğru olacak.
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
                  Daha detaylı istatistikler için günlük kayıtlarınızı eklemeye devam edin.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}