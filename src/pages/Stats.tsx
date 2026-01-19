// 🌸 Statistics Page
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Heart, Calendar } from 'lucide-react';
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
  Tooltip
} from 'recharts';
import { BottomNav } from '@/components/BottomNav';
import { useCycleData } from '@/hooks/useCycleData';
import { SYMPTOM_LABELS, MOOD_LABELS } from '@/types/cycle';
import { format, subDays, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

const COLORS = ['#F472B6', '#A78BFA', '#FB923C', '#34D399', '#60A5FA', '#FBBF24'];

export default function StatsPage() {
  const { entries, cycleSettings, userSettings } = useCycleData();

  // Calculate symptom frequency
  const symptomStats = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        counts[symptom] = (counts[symptom] || 0) + 1;
      });
    });
    
    return Object.entries(counts)
      .map(([symptom, count]) => ({
        name: SYMPTOM_LABELS[symptom as keyof typeof SYMPTOM_LABELS]?.tr || symptom,
        emoji: SYMPTOM_LABELS[symptom as keyof typeof SYMPTOM_LABELS]?.emoji || '•',
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [entries]);

  // Calculate mood distribution
  const moodStats = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        counts[entry.mood] = (counts[entry.mood] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([mood, count]) => ({
        name: MOOD_LABELS[mood as keyof typeof MOOD_LABELS]?.tr || mood,
        emoji: MOOD_LABELS[mood as keyof typeof MOOD_LABELS]?.emoji || '😐',
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  // Mood trend over last 14 days
  const moodTrend = useMemo(() => {
    const moodValues: Record<string, number> = {
      happy: 5, energetic: 4, calm: 3, neutral: 2, tired: 1, sad: 0, anxious: -1, irritable: -2
    };
    
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      return {
        date: format(date, 'd MMM', { locale: tr }),
        value: entry?.mood ? moodValues[entry.mood] ?? 2 : null,
        mood: entry?.mood,
      };
    });
    
    return last14Days;
  }, [entries]);

  // Calculate cycle stats
  const cycleStats = useMemo(() => {
    const periodDays = entries.filter(e => e.flowLevel !== 'none').length;
    const loggedDays = entries.length;
    const symptomsLogged = entries.reduce((sum, e) => sum + e.symptoms.length, 0);
    
    return {
      avgCycleLength: cycleSettings.cycleLength,
      avgPeriodLength: cycleSettings.periodLength,
      periodDays,
      loggedDays,
      symptomsLogged,
    };
  }, [entries, cycleSettings]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: {
    icon: typeof TrendingUp;
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">İstatistikler</h1>
        <p className="text-muted-foreground text-sm mt-1">Döngü verilerine genel bakış</p>
      </header>

      <main className="px-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Calendar}
            title="Döngü Uzunluğu"
            value={`${cycleStats.avgCycleLength}`}
            subtitle="gün ortalama"
            color="bg-primary"
          />
          <StatCard
            icon={Activity}
            title="Regl Süresi"
            value={`${cycleStats.avgPeriodLength}`}
            subtitle="gün ortalama"
            color="bg-period"
          />
          <StatCard
            icon={Heart}
            title="Kayıtlı Gün"
            value={cycleStats.loggedDays}
            subtitle="toplam giriş"
            color="bg-accent"
          />
          <StatCard
            icon={TrendingUp}
            title="Semptom"
            value={cycleStats.symptomsLogged}
            subtitle="toplam kayıt"
            color="bg-fertile"
          />
        </div>

        {/* Symptom Frequency Chart */}
        {symptomStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <h3 className="font-semibold text-foreground mb-4">En Sık Semptomlar</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value, index) => `${symptomStats[index]?.emoji || ''} ${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} gün`, 'Sıklık']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {symptomStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Mood Distribution */}
        {moodStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <h3 className="font-semibold text-foreground mb-4">Ruh Hali Dağılımı</h3>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {moodStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {moodStats.slice(0, 4).map((mood, index) => (
                  <div key={mood.name} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{mood.emoji}</span>
                    <span className="text-muted-foreground">{mood.name}</span>
                    <span className="ml-auto font-medium">{mood.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mood Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <h3 className="font-semibold text-foreground mb-4">Son 14 Gün Ruh Hali</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodTrend}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval={2}
                />
                <YAxis hide domain={[-3, 6]} />
                <Tooltip 
                  formatter={(value, _, props) => [
                    props.payload.mood 
                      ? MOOD_LABELS[props.payload.mood as keyof typeof MOOD_LABELS]?.tr 
                      : 'Kayıt yok',
                    'Ruh Hali'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Empty State */}
        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <span className="text-5xl">📊</span>
            <p className="text-muted-foreground mt-4">
              Henüz yeterli veri yok. Günlük kayıtlar ekledikçe istatistikler burada görünecek.
            </p>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
