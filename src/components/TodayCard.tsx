// 🌸 Today Status Card Component - Performance Optimized
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPhaseInfo } from '@/lib/predictions';
import type { CyclePhase, CyclePrediction } from '@/types/cycle';
import { format, parseISO, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { X, ChevronRight } from 'lucide-react';

interface TodayCardProps {
  phase: CyclePhase | null;
  prediction: CyclePrediction | null;
  language?: 'tr' | 'en';
}

const phaseGradients = {
  period: 'from-rose-400 via-pink-500 to-rose-600',
  follicular: 'from-emerald-400 via-teal-500 to-cyan-500',
  fertile: 'from-amber-400 via-orange-400 to-yellow-500',
  ovulation: 'from-violet-400 via-purple-500 to-fuchsia-500',
  luteal: 'from-slate-400 via-slate-500 to-gray-500',
  pms: 'from-orange-400 via-amber-500 to-yellow-600',
};

const phaseAccentColors = {
  period: 'text-rose-100',
  follicular: 'text-emerald-100',
  fertile: 'text-amber-100',
  ovulation: 'text-violet-100',
  luteal: 'text-slate-200',
  pms: 'text-orange-100',
};

const phaseDetails: Record<string, { tips: string[]; activities: string[]; nutrition: string[] }> = {
  period: {
    tips: ['Bol su için', 'Hafif egzersiz yapın', 'Sıcak kompres uygulayın'],
    activities: ['Yoga', 'Yürüyüş', 'Meditasyon'],
    nutrition: ['Demir açısından zengin gıdalar', 'Koyu yeşil yapraklılar', 'Kırmızı et'],
  },
  follicular: {
    tips: ['Enerji seviyeniz yükseliyor', 'Yeni projeler başlatın', 'Sosyal aktiviteler planlayın'],
    activities: ['HIIT', 'Koşu', 'Dans'],
    nutrition: ['Protein ağırlıklı', 'Taze sebzeler', 'Fermente gıdalar'],
  },
  fertile: {
    tips: ['En verimli dönemdesiniz', 'Yaratıcılığınız zirve', 'İletişim becerileriniz güçlü'],
    activities: ['Yoğun antrenman', 'Takım sporları', 'Sosyal etkinlikler'],
    nutrition: ['Omega-3 kaynakları', 'Çinko içeren gıdalar', 'B vitamini'],
  },
  ovulation: {
    tips: ['Doğurganlık zirvede', 'Enerji maksimum', 'Önemli kararlar için ideal'],
    activities: ['Güç antrenmanı', 'Rekabetçi sporlar', 'Sunum yapın'],
    nutrition: ['Antioksidan zengin', 'E vitamini', 'Taze meyveler'],
  },
  luteal: {
    tips: ['Dinlenmeye öncelik verin', 'Stresten kaçının', 'Uyku düzenine dikkat'],
    activities: ['Pilates', 'Hafif yürüyüş', 'Esneme'],
    nutrition: ['Magnezyum', 'Kompleks karbonhidrat', 'Bitter çikolata'],
  },
  pms: {
    tips: ['Kendinize nazik olun', 'Rahatlama teknikleri', 'Destek isteyin'],
    activities: ['Yoga', 'Yüzme', 'Nefes egzersizleri'],
    nutrition: ['Kalsiyum', 'B6 vitamini', 'Tam tahıllar'],
  },
};

// Circular progress component
function CircularProgress({ progress, dayNumber, accentColor, language }: {
  progress: number;
  dayNumber: number;
  accentColor: string;
  language: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
        <circle
          cx="60" cy="60" r={radius}
          stroke="rgba(255,255,255,0.9)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{dayNumber}</span>
        <span className={`text-xs ${accentColor}`}>
          {language === 'tr' ? 'gün' : 'day'}
        </span>
      </div>
    </div>
  );
}

export function TodayCard({ phase, prediction, language = 'tr' }: TodayCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!phase || !prediction) {
    return (
      <div className="rounded-[2rem] bg-gradient-to-br from-muted to-muted/50 p-6 animate-pulse">
        <div className="h-32 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    );
  }

  const phaseInfo = getPhaseInfo(phase, language);
  const today = new Date();
  const nextPeriod = parseISO(prediction.nextPeriodStart);
  const ovulationDate = parseISO(prediction.ovulationDate);
  const daysUntilPeriod = differenceInDays(nextPeriod, today);
  const daysUntilOvulation = differenceInDays(ovulationDate, today);
  const cycleLength = 28;
  const progress = (phase.dayNumber / cycleLength) * 100;
  const details = phaseDetails[phase.type];

  return (
    <>
      <div
        className={`relative rounded-[2rem] bg-gradient-to-br ${phaseGradients[phase.type]} p-6 overflow-hidden shadow-xl cursor-pointer transition-transform duration-150 active:scale-[0.98]`}
        onClick={() => setShowDetails(true)}
      >
        {/* Static decorative elements - no animations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Top Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className={`text-sm font-medium ${phaseAccentColors[phase.type]} opacity-80 mb-1`}>
                {language === 'tr' ? 'Şu an' : 'Currently'}
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">
                {phaseInfo.title}
              </h2>
              <p className={`text-sm ${phaseAccentColors[phase.type]}`}>
                {phaseInfo.subtitle}
              </p>
            </div>
            
            {/* Emoji - static */}
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-white/30 rounded-full" />
              <span className="relative text-4xl">{phaseInfo.emoji}</span>
            </div>
          </div>

          {/* Circular Progress Section */}
          <div className="flex items-center gap-6 mt-6">
            <CircularProgress 
              progress={progress} 
              dayNumber={phase.dayNumber} 
              accentColor={phaseAccentColors[phase.type]}
              language={language}
            />

            {/* Info Cards */}
            <div className="flex-1 space-y-3">
              {phase.type !== 'period' && !phase.isLate && daysUntilPeriod > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
                  <p className={`text-xs ${phaseAccentColors[phase.type]} mb-0.5`}>
                    {language === 'tr' ? 'Sonraki Regl' : 'Next Period'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">{daysUntilPeriod}</span>
                    <span className={`text-sm ${phaseAccentColors[phase.type]}`}>
                      {language === 'tr' ? 'gün' : 'days'}
                    </span>
                  </div>
                  <p className={`text-xs ${phaseAccentColors[phase.type]} opacity-70`}>
                    {format(nextPeriod, 'd MMMM', { locale: language === 'tr' ? tr : undefined })}
                  </p>
                </div>
              )}

              {(phase.type === 'fertile' || phase.type === 'follicular') && daysUntilOvulation >= 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
                  <p className={`text-xs ${phaseAccentColors[phase.type]} mb-0.5`}>
                    {language === 'tr' ? 'Yumurtlama' : 'Ovulation'}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {daysUntilOvulation === 0 
                      ? (language === 'tr' ? 'Bugün' : 'Today')
                      : format(ovulationDate, 'd MMMM', { locale: language === 'tr' ? tr : undefined })}
                  </p>
                </div>
              )}

              {phase.type === 'period' && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
                  <p className={`text-xs ${phaseAccentColors[phase.type]} mb-0.5`}>
                    {language === 'tr' ? 'Regl Dönemi' : 'Period'}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {language === 'tr' ? `${phase.dayNumber}. gün` : `Day ${phase.dayNumber}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom tip */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <p className={`text-xs ${phaseAccentColors[phase.type]} flex-1`}>
              {language === 'tr' ? 'Detaylar için dokun' : 'Tap for details'}
            </p>
            <ChevronRight className={`w-4 h-4 ${phaseAccentColors[phase.type]}`} />
          </div>
        </div>
      </div>

      {/* Phase Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
            />

            {/* Modal Content */}
            <motion.div
              className={`fixed inset-x-4 top-1/2 z-50 rounded-[2rem] bg-gradient-to-br ${phaseGradients[phase.type]} p-6 overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto`}
              initial={{ opacity: 0, scale: 0.9, y: '-40%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, y: '-40%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {/* Static decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Header */}
              <div className="relative z-10 flex items-center gap-4 mb-6">
                <span className="text-5xl">{phaseInfo.emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white">{phaseInfo.title}</h2>
                  <p className={`text-sm ${phaseAccentColors[phase.type]}`}>{phaseInfo.subtitle}</p>
                </div>
              </div>

              {/* Content sections - no staggered animations */}
              <div className="relative z-10 space-y-5">
                {/* Tips */}
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    {language === 'tr' ? 'İpuçları' : 'Tips'}
                  </h3>
                  <div className="space-y-2">
                    {details.tips.map((tip, i) => (
                      <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5">
                        <p className="text-sm text-white">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <span className="text-lg">🏃‍♀️</span>
                    {language === 'tr' ? 'Önerilen Aktiviteler' : 'Recommended Activities'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.activities.map((activity, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/20 rounded-full text-sm text-white font-medium">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nutrition */}
                <div>
                  <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                    <span className="text-lg">🥗</span>
                    {language === 'tr' ? 'Beslenme Önerileri' : 'Nutrition Tips'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {details.nutrition.map((item, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/20 rounded-full text-sm text-white font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
