// 🌸 Today Status Card Component
import { motion } from 'framer-motion';
import { getPhaseInfo } from '@/lib/predictions';
import type { CyclePhase, CyclePrediction } from '@/types/cycle';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TodayCardProps {
  phase: CyclePhase | null;
  prediction: CyclePrediction | null;
  language?: 'tr' | 'en';
}

const phaseColors = {
  period: 'from-period to-period-dark',
  follicular: 'from-safe to-green-400',
  fertile: 'from-fertile to-amber-400',
  ovulation: 'from-ovulation to-purple-500',
  luteal: 'from-slate-400 to-slate-500',
  pms: 'from-pms to-orange-400',
};

const phaseBackgrounds = {
  period: 'bg-period-light',
  follicular: 'bg-green-50 dark:bg-green-950/30',
  fertile: 'bg-fertile-light',
  ovulation: 'bg-purple-50 dark:bg-purple-950/30',
  luteal: 'bg-slate-50 dark:bg-slate-900/30',
  pms: 'bg-orange-50 dark:bg-orange-950/30',
};

export function TodayCard({ phase, prediction, language = 'tr' }: TodayCardProps) {
  if (!phase || !prediction) {
    return (
      <div className="rounded-3xl bg-card p-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2 mb-2" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    );
  }

  const phaseInfo = getPhaseInfo(phase, language);
  const nextPeriod = parseISO(prediction.nextPeriodStart);
  const ovulationDate = parseISO(prediction.ovulationDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-6 ${phaseBackgrounds[phase.type]}`}
    >
      {/* Main Status */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${phaseColors[phase.type]} flex items-center justify-center shadow-lg`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <span className="text-3xl">{phaseInfo.emoji}</span>
        </motion.div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{phaseInfo.title}</h2>
          <p className="text-muted-foreground">{phaseInfo.subtitle}</p>
        </div>
      </div>

      {/* Cycle Day Ring */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted/30"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="24"
                stroke="url(#cycleGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 150' }}
                animate={{ 
                  strokeDasharray: `${(phase.dayNumber / 28) * 150} 150` 
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
              {phase.dayNumber}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {language === 'tr' ? 'Döngü Günü' : 'Cycle Day'}
            </p>
          </div>
        </div>

        {/* Quick Info Pills */}
        <div className="flex flex-col gap-2 text-right text-sm">
          {phase.type !== 'period' && !phase.isLate && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-muted-foreground">
                {language === 'tr' ? 'Sonraki Regl' : 'Next Period'}
              </span>
              <span className="font-medium text-foreground">
                {format(nextPeriod, 'd MMM', { locale: language === 'tr' ? tr : undefined })}
              </span>
            </div>
          )}
          {phase.type === 'fertile' || phase.type === 'follicular' ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-muted-foreground">
                {language === 'tr' ? 'Yumurtlama' : 'Ovulation'}
              </span>
              <span className="font-medium text-foreground">
                {format(ovulationDate, 'd MMM', { locale: language === 'tr' ? tr : undefined })}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
