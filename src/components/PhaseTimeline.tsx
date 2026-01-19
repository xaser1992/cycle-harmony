// 🌸 Phase Timeline Component
import { motion } from 'framer-motion';
import type { CyclePrediction, CycleSettings } from '@/types/cycle';
import { parseISO, format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PhaseTimelineProps {
  prediction: CyclePrediction | null;
  settings: CycleSettings;
  language?: 'tr' | 'en';
}

export function PhaseTimeline({ prediction, settings, language = 'tr' }: PhaseTimelineProps) {
  if (!prediction) return null;

  const today = new Date();
  const lastPeriodStart = parseISO(settings.lastPeriodStart);
  const cycleLength = settings.cycleLength;
  const currentDay = differenceInDays(today, lastPeriodStart) + 1;
  const progress = Math.min(100, Math.max(0, (currentDay / cycleLength) * 100));

  const phases = [
    {
      name: language === 'tr' ? 'Regl' : 'Period',
      start: 0,
      width: (settings.periodLength / cycleLength) * 100,
      color: 'bg-period',
    },
    {
      name: language === 'tr' ? 'Foliküler' : 'Follicular',
      start: (settings.periodLength / cycleLength) * 100,
      width: ((differenceInDays(parseISO(prediction.fertileWindowStart), lastPeriodStart) - settings.periodLength) / cycleLength) * 100,
      color: 'bg-safe',
    },
    {
      name: language === 'tr' ? 'Doğurgan' : 'Fertile',
      start: (differenceInDays(parseISO(prediction.fertileWindowStart), lastPeriodStart) / cycleLength) * 100,
      width: (7 / cycleLength) * 100,
      color: 'bg-fertile',
    },
    {
      name: language === 'tr' ? 'Luteal' : 'Luteal',
      start: (differenceInDays(parseISO(prediction.fertileWindowEnd), lastPeriodStart) / cycleLength) * 100,
      width: 100 - (differenceInDays(parseISO(prediction.fertileWindowEnd), lastPeriodStart) / cycleLength) * 100,
      color: 'bg-slate-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {language === 'tr' ? 'Döngü İlerlemesi' : 'Cycle Progress'}
        </span>
        <span className="font-medium text-foreground">
          {language === 'tr' ? `${currentDay}. gün / ${cycleLength}` : `Day ${currentDay} of ${cycleLength}`}
        </span>
      </div>
      
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        {phases.map((phase, index) => (
          <div
            key={phase.name}
            className={`absolute h-full ${phase.color} opacity-60`}
            style={{
              left: `${phase.start}%`,
              width: `${phase.width}%`,
            }}
          />
        ))}
        
        {/* Progress Indicator */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full shadow-lg"
          initial={{ left: '0%' }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Phase Labels */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-period" />
          <span className="text-muted-foreground">{language === 'tr' ? 'Regl' : 'Period'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-fertile" />
          <span className="text-muted-foreground">{language === 'tr' ? 'Doğurgan' : 'Fertile'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-ovulation" />
          <span className="text-muted-foreground">{language === 'tr' ? 'Yumurtlama' : 'Ovulation'}</span>
        </div>
      </div>
    </div>
  );
}
