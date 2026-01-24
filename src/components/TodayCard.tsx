// 🌸 Today Status Card Component - Performance Optimized
import { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPhaseInfo } from '@/lib/predictions';
import { scheduleCustomReminder } from '@/lib/notifications';
import type { CyclePhase, CyclePrediction } from '@/types/cycle';
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { X, ChevronRight, CalendarDays, Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { App } from '@capacitor/app';

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

interface TodayCardProps {
  phase: CyclePhase | null;
  prediction: CyclePrediction | null;
  language?: 'tr' | 'en';
  onTap?: () => void;
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

type PhaseDeepDive = {
  sleep: string[];
  skin: string[];
  hormones: string[];
};

const getPhaseDeepDive = (phaseType: string, language: 'tr' | 'en'): PhaseDeepDive => {
  const trContent: Record<string, PhaseDeepDive> = {
    period: {
      sleep: ['Daha fazla uyku ihtiyacı normal', 'Akşam kafeini azalt, erken yat'],
      skin: ['Cilt daha hassas olabilir: nazik temizleyici + nemlendirici'],
      hormones: ['Östrojen/progesteron düşük: yorgunluk ve hassasiyet artabilir'],
    },
    follicular: {
      sleep: ['Enerji artar: düzenli uyku ritmi performansı yükseltir'],
      skin: ['Cilt genelde daha dengeli: hafif eksfoliasyon iyi gelebilir'],
      hormones: ['Östrojen yükselir: motivasyon ve odak artabilir'],
    },
    fertile: {
      sleep: ['Enerjin yüksek: antrenmanı gündüze al, geceyi sakin tut'],
      skin: ['Parlama artabilir: hafif jel nemlendirici tercih et'],
      hormones: ['Östrojen zirveye yakın: sosyal/iletişim güçlü olabilir'],
    },
    ovulation: {
      sleep: ['Bazılarında uyku hafifleşebilir: ekranı erkenden kapat'],
      skin: ['Cilt daha canlı görünebilir: güneş korumasını aksatma'],
      hormones: ['LH piki + östrojen yüksek: vücut ısısı artabilir'],
    },
    luteal: {
      sleep: ['Uykun dalgalanabilir: magnezyum ve rutin yardımcı olur'],
      skin: ['Akne eğilimi artabilir: ağır ürünleri azalt'],
      hormones: ['Progesteron artar: şişkinlik/iştah değişebilir'],
    },
    pms: {
      sleep: ['Uyku kalitesi düşebilir: ılık duş ve nefes egzersizi dene'],
      skin: ['İltihap artabilir: minimal bakım + noktasal destek'],
      hormones: ['Progesteron düşüşe geçer: ruh hali dalgalanabilir'],
    },
  };

  const enContent: Record<string, PhaseDeepDive> = {
    period: {
      sleep: ['Needing more sleep is normal', 'Reduce evening caffeine and go to bed earlier'],
      skin: ['Skin may be more sensitive: gentle cleanser + moisturizer'],
      hormones: ['Low estrogen/progesterone: fatigue and sensitivity can increase'],
    },
    follicular: {
      sleep: ['Energy rises: consistent sleep boosts performance'],
      skin: ['Usually more balanced: light exfoliation can help'],
      hormones: ['Estrogen rises: motivation and focus can improve'],
    },
    fertile: {
      sleep: ['High energy: train earlier, keep nights calmer'],
      skin: ['More oiliness possible: try a lightweight gel moisturizer'],
      hormones: ['Estrogen near peak: social/communication can feel stronger'],
    },
    ovulation: {
      sleep: ['Sleep can feel lighter: reduce screens earlier'],
      skin: ['Often more “glowy”: don’t skip sunscreen'],
      hormones: ['LH surge + high estrogen: body temperature may rise'],
    },
    luteal: {
      sleep: ['Sleep may fluctuate: magnesium and a routine can help'],
      skin: ['More acne-prone: avoid heavy products'],
      hormones: ['Higher progesterone: bloating/appetite can change'],
    },
    pms: {
      sleep: ['Sleep quality may drop: warm shower and breathing can help'],
      skin: ['Inflammation may increase: minimal routine + spot care'],
      hormones: ['Progesterone starts dropping: mood can fluctuate'],
    },
  };

  const dict = language === 'tr' ? trContent : enContent;
  return dict[phaseType] ?? dict.luteal;
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
        <circle cx="60" cy="60" r={radius} stroke="hsl(var(--background) / 0.2)" strokeWidth="8" fill="none" />
        <circle
          cx="60" cy="60" r={radius}
          stroke="hsl(var(--background) / 0.9)" strokeWidth="8" fill="none" strokeLinecap="round"
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

export function TodayCard({ phase, prediction, language = 'tr', onTap }: TodayCardProps) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [activeInfoCard, setActiveInfoCard] = useState<'period' | 'ovulation' | 'fertile' | null>(null);

  // Android back button support for modals
  useEffect(() => {
    const isAnyModalOpen = showDetails || activeInfoCard !== null;
    if (!isAnyModalOpen) return;

    const backHandler = App.addListener('backButton', () => {
      if (activeInfoCard) {
        setActiveInfoCard(null);
      } else if (showDetails) {
        setShowDetails(false);
      }
    });

    return () => {
      backHandler.then(h => h.remove());
    };
  }, [showDetails, activeInfoCard]);

  const handleNavigateToCalendar = (dateStr: string) => {
    setActiveInfoCard(null);
    navigate('/calendar', { state: { selectedDate: dateStr } });
  };

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
  const deepDive = getPhaseDeepDive(phase.type, language);

  return (
    <>
      <div
        className={`relative rounded-[2rem] bg-gradient-to-br ${phaseGradients[phase.type]} p-6 overflow-hidden shadow-xl cursor-pointer transition-transform duration-150 active:scale-[0.98]`}
        onClick={() => {
          if (onTap) {
            onTap();
          } else {
            setShowDetails(true);
          }
        }}
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

            {/* Info Cards - Clickable with animated icons */}
            <div className="flex-1 space-y-3">
              {phase.type !== 'period' && !phase.isLate && daysUntilPeriod > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); setActiveInfoCard('period'); }}
                  className="w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-left flex items-center gap-2"
                >
                  <motion.span 
                    className="text-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    🌸
                  </motion.span>
                  <div className="flex-1">
                    <p className={`text-xs ${phaseAccentColors[phase.type]} mb-0.5`}>
                      {language === 'tr' ? 'Sonraki Regl' : 'Next Period'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-white">{daysUntilPeriod}</span>
                      <span className={`text-xs ${phaseAccentColors[phase.type]}`}>
                        {language === 'tr' ? 'gün' : 'days'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${phaseAccentColors[phase.type]}`} />
                </motion.button>
              )}

              {(phase.type === 'fertile' || phase.type === 'follicular') && daysUntilOvulation >= 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); setActiveInfoCard('ovulation'); }}
                  className="w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-left flex items-center gap-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                      <circle cx="12" cy="12" r="5" fill="#a855f7" opacity="0.6" />
                      <circle cx="10" cy="10" r="2" fill="white" opacity="0.8" />
                    </svg>
                  </motion.div>
                  <div className="flex-1">
                    <p className={`text-xs ${phaseAccentColors[phase.type]} mb-0.5`}>
                      {language === 'tr' ? 'Yumurtlama' : 'Ovulation'}
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {daysUntilOvulation === 0 
                        ? (language === 'tr' ? 'Bugün' : 'Today')
                        : format(ovulationDate, 'd MMMM', { locale: language === 'tr' ? tr : undefined })}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${phaseAccentColors[phase.type]}`} />
                </motion.button>
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

          {/* Bottom tip - Opens phase details */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
            className="mt-4 w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <p className={`text-xs ${phaseAccentColors[phase.type]} flex-1 text-left`}>
              {language === 'tr' ? 'Faz detayları ve öneriler' : 'Phase details & tips'}
            </p>
            <ChevronRight className={`w-4 h-4 ${phaseAccentColors[phase.type]}`} />
          </motion.button>
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
              className={`fixed inset-x-3 top-1/2 z-[51] rounded-2xl bg-gradient-to-br ${phaseGradients[phase.type]} p-4 shadow-2xl max-h-[75vh] overflow-y-auto`}
              initial={{ opacity: 0, scale: 0.95, y: '-45%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-45%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {/* Close button - high z-index, positioned at top */}
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center z-[60] active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Header - compact */}
              <div className="flex items-center gap-3 mb-4 pr-10">
                <span className="text-4xl">{phaseInfo.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{phaseInfo.title}</h2>
                  <p className={`text-xs ${phaseAccentColors[phase.type]}`}>{phaseInfo.subtitle}</p>
                </div>
              </div>

              {/* Content sections - compact spacing */}
              <div className="space-y-3">
                {/* Tips */}
                <div>
                  <h3 className="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                    <span>💡</span>
                    {language === 'tr' ? 'İpuçları' : 'Tips'}
                  </h3>
                  <div className="space-y-1.5">
                    {details.tips.map((tip, i) => (
                      <div key={i} className="bg-white/15 rounded-lg px-3 py-2">
                        <p className="text-xs text-white">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <h3 className="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                    <span>🏃‍♀️</span>
                    {language === 'tr' ? 'Aktiviteler' : 'Activities'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {details.activities.map((activity, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Nutrition */}
                <div>
                  <h3 className="text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                    <span>🥗</span>
                    {language === 'tr' ? 'Beslenme' : 'Nutrition'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {details.nutrition.map((item, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Deep dive - compact grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/15 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-white mb-1">😴 {language === 'tr' ? 'Uyku' : 'Sleep'}</p>
                    <p className="text-[10px] text-white/80 leading-tight">{deepDive.sleep[0]}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-white mb-1">✨ {language === 'tr' ? 'Cilt' : 'Skin'}</p>
                    <p className="text-[10px] text-white/80 leading-tight">{deepDive.skin[0]}</p>
                  </div>
                  <div className="bg-white/15 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-white mb-1">🧬 {language === 'tr' ? 'Hormon' : 'Hormones'}</p>
                    <p className="text-[10px] text-white/80 leading-tight">{deepDive.hormones[0]}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upcoming Date Info Modals */}
      <AnimatePresence>
        {activeInfoCard && prediction && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              onClick={() => setActiveInfoCard(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`fixed inset-x-3 top-16 bottom-16 z-[101] rounded-2xl p-4 shadow-2xl overflow-y-auto ${
                activeInfoCard === 'period' ? 'bg-gradient-to-br from-rose-400 to-pink-500' :
                activeInfoCard === 'ovulation' ? 'bg-gradient-to-br from-violet-400 to-purple-500' :
                'bg-gradient-to-br from-cyan-400 to-teal-400'
              }`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveInfoCard(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center z-[110] active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Period Info */}
              {activeInfoCard === 'period' && (
                <div className="space-y-3 pr-8">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🌸</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{language === 'tr' ? 'Sonraki Regl' : 'Next Period'}</h3>
                      <p className="text-sm text-white/80">{format(parseISO(prediction.nextPeriodStart), 'd MMMM EEEE', { locale: language === 'tr' ? tr : undefined })}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white/15 rounded-xl p-3">
                      <h4 className="font-semibold text-white text-sm mb-1.5">📋 {language === 'tr' ? 'Ne Beklemeli?' : 'What to Expect?'}</h4>
                      <ul className="text-xs text-white/90 space-y-0.5">
                        <li>• {language === 'tr' ? 'Adet kanaması ortalama 3-7 gün sürer' : 'Period bleeding lasts 3-7 days on average'}</li>
                        <li>• {language === 'tr' ? 'İlk 1-2 gün akış daha yoğun olabilir' : 'Flow may be heavier in the first 1-2 days'}</li>
                        <li>• {language === 'tr' ? 'Kramp, yorgunluk ve ruh hali değişimleri normal' : 'Cramps, fatigue and mood changes are normal'}</li>
                      </ul>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3">
                      <h4 className="font-semibold text-white text-sm mb-1.5">💡 {language === 'tr' ? 'İpuçları' : 'Tips'}</h4>
                      <ul className="text-xs text-white/90 space-y-0.5">
                        <li>• {language === 'tr' ? 'Bol su için ve demir açısından zengin gıdalar tüketin' : 'Drink plenty of water and eat iron-rich foods'}</li>
                        <li>• {language === 'tr' ? 'Sıcak kompres ağrıları hafifletebilir' : 'A warm compress can relieve pain'}</li>
                        <li>• {language === 'tr' ? 'Hafif egzersiz ve yoga faydalı olabilir' : 'Light exercise and yoga can be helpful'}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNavigateToCalendar(prediction.nextPeriodStart)}
                      className="flex-1 bg-white/20 active:bg-white/30 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors"
                    >
                      <CalendarDays className="w-4 h-4 text-white" />
                      <span className="font-semibold text-white text-xs">{language === 'tr' ? 'Takvim' : 'Calendar'}</span>
                    </button>
                    <button
                      onClick={async () => {
                        const success = await scheduleCustomReminder(
                          language === 'tr' ? 'Regl Yaklaşıyor 🌸' : 'Period Approaching 🌸',
                          language === 'tr' ? 'Regl dönemin yarın başlayabilir. Hazırlıklı ol!' : 'Your period may start tomorrow. Be prepared!',
                          addDays(parseISO(prediction.nextPeriodStart), -1),
                          language
                        );
                        if (success) {
                          toast.success(language === 'tr' ? 'Hatırlatıcı kuruldu!' : 'Reminder set!');
                        } else {
                          toast.error(language === 'tr' ? 'Bildirim izni gerekli' : 'Notification permission required');
                        }
                      }}
                      className="bg-white/20 active:bg-white/30 rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors"
                    >
                      <Bell className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Ovulation Info */}
              {activeInfoCard === 'ovulation' && (
                <div className="space-y-3 pr-8">
                  <div className="flex items-center gap-3">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="white" opacity="0.9" />
                      <circle cx="12" cy="12" r="6" fill="#a855f7" opacity="0.6" />
                      <circle cx="9" cy="9" r="2.5" fill="white" opacity="0.8" />
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold text-white">{language === 'tr' ? 'Yumurtlama Günü' : 'Ovulation Day'}</h3>
                      <p className="text-sm text-white/80">{format(parseISO(prediction.ovulationDate), 'd MMMM EEEE', { locale: language === 'tr' ? tr : undefined })}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white/15 rounded-xl p-3">
                      <h4 className="font-semibold text-white text-sm mb-1.5">🥚 {language === 'tr' ? 'Yumurtlama Nedir?' : 'What is Ovulation?'}</h4>
                      <ul className="text-xs text-white/90 space-y-0.5">
                        <li>• {language === 'tr' ? 'Yumurtalıktan olgun bir yumurta salınır' : 'A mature egg is released from the ovary'}</li>
                        <li>• {language === 'tr' ? 'En verimli gününüz - hamilelik şansı en yüksek' : 'Your most fertile day - highest chance of pregnancy'}</li>
                        <li>• {language === 'tr' ? 'Yumurta 12-24 saat boyunca döllenebilir' : 'The egg can be fertilized for 12-24 hours'}</li>
                      </ul>
                    </div>
                    <div className="bg-white/15 rounded-xl p-3">
                      <h4 className="font-semibold text-white text-sm mb-1.5">✨ {language === 'tr' ? 'Belirtiler' : 'Symptoms'}</h4>
                      <ul className="text-xs text-white/90 space-y-0.5">
                        <li>• {language === 'tr' ? 'Vücut sıcaklığında hafif artış' : 'Slight increase in body temperature'}</li>
                        <li>• {language === 'tr' ? 'Servikal mukus yumurta akı kıvamında' : 'Cervical mucus like egg white consistency'}</li>
                        <li>• {language === 'tr' ? 'Bazı kadınlarda hafif kasık ağrısı' : 'Some women may experience mild pelvic pain'}</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNavigateToCalendar(prediction.ovulationDate)}
                      className="flex-1 bg-white/20 active:bg-white/30 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors"
                    >
                      <CalendarDays className="w-4 h-4 text-white" />
                      <span className="font-semibold text-white text-xs">{language === 'tr' ? 'Takvim' : 'Calendar'}</span>
                    </button>
                    <button
                      onClick={async () => {
                        const success = await scheduleCustomReminder(
                          language === 'tr' ? 'Yumurtlama Günü 🥚' : 'Ovulation Day 🥚',
                          language === 'tr' ? 'Bugün tahmini yumurtlama günün!' : 'Today is your estimated ovulation day!',
                          parseISO(prediction.ovulationDate),
                          language
                        );
                        if (success) {
                          toast.success(language === 'tr' ? 'Hatırlatıcı kuruldu!' : 'Reminder set!');
                        } else {
                          toast.error(language === 'tr' ? 'Bildirim izni gerekli' : 'Notification permission required');
                        }
                      }}
                      className="bg-white/20 active:bg-white/30 rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors"
                    >
                      <Bell className="w-4 h-4 text-white" />
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
                  <div className="space-y-3 pr-8">
                    <div className="flex items-center gap-3">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22c-2-2-8-6.5-8-13a8 8 0 1 1 16 0c0 6.5-6 11-8 13z" fill="white" opacity="0.9" />
                        <path d="M12 18c-1.3-1.3-5-4.5-5-9a5 5 0 1 1 10 0c0 4.5-3.7 7.7-5 9z" className="fill-teal" opacity="0.5" />
                        <circle cx="10" cy="9" r="2" fill="white" opacity="0.8" />
                      </svg>
                      <div>
                        <h3 className="text-xl font-bold text-white">{language === 'tr' ? 'Doğurgan Dönem' : 'Fertile Window'}</h3>
                        <p className="text-sm text-white/80">
                          {format(fertileStart, 'd MMM', { locale: language === 'tr' ? tr : undefined })} - {format(fertileEnd, 'd MMM', { locale: language === 'tr' ? tr : undefined })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Compact chance display */}
                    <div className="bg-white/15 rounded-xl p-3">
                      <h4 className="font-semibold text-white text-sm mb-2">📊 {language === 'tr' ? 'Hamilelik Şansı' : 'Pregnancy Chance'}</h4>
                      <div className="space-y-1.5">
                        {fertileDays.map((day) => {
                          const daysFromOvulation = differenceInDays(day, ovulationDate);
                          const chance = getFertilityChance(daysFromOvulation);
                          const isOvulationDay = daysFromOvulation === 0;
                          
                          return (
                            <div key={day.toISOString()} className="flex items-center gap-2">
                              <div className="w-12 text-[10px] text-white/80">
                                {format(day, 'd MMM', { locale: language === 'tr' ? tr : undefined })}
                              </div>
                              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isOvulationDay ? 'bg-gradient-to-r from-violet-400 to-purple-500' : 'bg-white/60'}`}
                                  style={{ width: `${chance}%` }}
                                />
                              </div>
                              <div className={`w-8 text-right text-xs font-bold ${isOvulationDay ? 'text-white' : 'text-white/80'}`}>
                                {chance}%
                              </div>
                              {isOvulationDay && <span className="text-[10px]">🥚</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-white/15 rounded-xl p-3">
                      <h4 className="font-semibold text-white text-sm mb-1.5">🎯 {language === 'tr' ? 'Bilgi' : 'Info'}</h4>
                      <ul className="text-xs text-white/90 space-y-0.5">
                        <li>• {language === 'tr' ? 'Yumurtlama günü en yüksek şans (%33)' : 'Ovulation day has highest chance (33%)'}</li>
                        <li>• {language === 'tr' ? 'Sperm 5 güne kadar canlı kalabilir' : 'Sperm can survive up to 5 days'}</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNavigateToCalendar(prediction.fertileWindowStart)}
                        className="flex-1 bg-white/20 active:bg-white/30 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors"
                      >
                        <CalendarDays className="w-4 h-4 text-white" />
                        <span className="font-semibold text-white text-xs">{language === 'tr' ? 'Takvim' : 'Calendar'}</span>
                      </button>
                      <button
                        onClick={async () => {
                          const success = await scheduleCustomReminder(
                            language === 'tr' ? 'Doğurgan Dönem Başlıyor 💐' : 'Fertile Window Starting 💐',
                            language === 'tr' ? 'Yumurtlama dönemin başlıyor!' : 'Your fertile window is starting!',
                            fertileStart,
                            language
                          );
                          if (success) {
                            toast.success(language === 'tr' ? 'Hatırlatıcı kuruldu!' : 'Reminder set!');
                          } else {
                            toast.error(language === 'tr' ? 'Bildirim izni gerekli' : 'Notification permission required');
                          }
                        }}
                        className="bg-white/20 active:bg-white/30 rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors"
                      >
                        <Bell className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
