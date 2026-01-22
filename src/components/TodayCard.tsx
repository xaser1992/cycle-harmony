// 🌸 Today Status Card Component - Performance Optimized with Animated Icons
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPhaseInfo } from '@/lib/predictions';
import { scheduleCustomReminder } from '@/lib/notifications';
import type { CyclePhase, CyclePrediction } from '@/types/cycle';
import { format, parseISO, differenceInDays, addDays, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { X, ChevronRight, CalendarDays, Bell } from 'lucide-react';
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
    [0]: 33,
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

// Animated Phase Icon Component
function PhaseIcon({ type, className = '' }: { type: string; className?: string }) {
  switch (type) {
    case 'period':
      return (
        <svg className={`${className} animate-pulse`} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="18" fill="white" opacity="0.9" />
          <path d="M24 12c-4 6-10 10-10 16a10 10 0 1 0 20 0c0-6-6-10-10-16z" fill="#f43f5e" opacity="0.7" />
          <circle cx="20" cy="22" r="3" fill="white" opacity="0.6" />
        </svg>
      );
    case 'ovulation':
      return (
        <svg className={`${className} animate-ping`} style={{ animationDuration: '2s' }} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="16" fill="white" opacity="0.9" />
          <circle cx="24" cy="24" r="10" fill="#a855f7" opacity="0.6" />
          <circle cx="20" cy="20" r="4" fill="white" opacity="0.8" />
        </svg>
      );
    case 'fertile':
      return (
        <svg className={`${className} animate-bounce`} style={{ animationDuration: '2s' }} viewBox="0 0 48 48" fill="none">
          <path d="M24 44c-3-3-12-10-12-20a12 12 0 1 1 24 0c0 10-9 17-12 20z" fill="white" opacity="0.9" />
          <path d="M24 38c-2-2-8-7-8-14a8 8 0 1 1 16 0c0 7-6 12-8 14z" fill="#14b8a6" opacity="0.5" />
          <circle cx="20" cy="20" r="3" fill="white" opacity="0.8" />
        </svg>
      );
    default:
      return null;
  }
}

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
        {/* Static decorative elements */}
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
            
            {/* Animated Phase Icon */}
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 blur-lg bg-white/30 rounded-full" />
              <PhaseIcon type={phase.type} className="relative w-12 h-12" />
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
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveInfoCard('period'); }}
                  className="w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-left flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className="w-6 h-6">
                    <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                      <path d="M12 6c-2 3-5 5-5 8a5 5 0 1 0 10 0c0-3-3-5-5-8z" fill="#f43f5e" opacity="0.7" />
                      <circle cx="10" cy="11" r="1.5" fill="white" opacity="0.6" />
                    </svg>
                  </div>
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
                </button>
              )}

              {(phase.type === 'fertile' || phase.type === 'follicular') && daysUntilOvulation >= 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveInfoCard('ovulation'); }}
                  className="w-full bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-left flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className="w-6 h-6">
                    <svg className="w-6 h-6 animate-ping" style={{ animationDuration: '2s' }} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                      <circle cx="12" cy="12" r="5" fill="#a855f7" opacity="0.6" />
                      <circle cx="10" cy="10" r="2" fill="white" opacity="0.8" />
                    </svg>
                  </div>
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
                </button>
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

          {/* Bottom tip - Clicking this shows details modal */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
            className="mt-4 w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <p className={`text-xs ${phaseAccentColors[phase.type]} flex-1 text-left`}>
              {language === 'tr' ? 'Detaylar için dokun' : 'Tap for details'}
            </p>
            <ChevronRight className={`w-4 h-4 ${phaseAccentColors[phase.type]}`} />
          </button>
        </div>
      </div>

      {/* Phase Details Modal */}
      {showDetails && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => setShowDetails(false)}
          />

          {/* Modal Content */}
          <div
            className={`fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 rounded-[2rem] bg-gradient-to-br ${phaseGradients[phase.type]} p-6 overflow-hidden shadow-2xl max-h-[80vh] overflow-y-auto animate-scale-in`}
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
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-[102] active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Header */}
            <div className="relative z-10 flex items-center gap-4 mb-6">
              <PhaseIcon type={phase.type} className="w-14 h-14" />
              <div>
                <h2 className="text-2xl font-bold text-white">{phaseInfo.title}</h2>
                <p className={`text-sm ${phaseAccentColors[phase.type]}`}>{phaseInfo.subtitle}</p>
              </div>
            </div>

            {/* Content sections */}
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
          </div>
        </>
      )}

      {/* Upcoming Date Info Modals */}
      {activeInfoCard && prediction && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setActiveInfoCard(null)}
          />
          <div
            className={`fixed inset-x-4 top-20 bottom-20 z-[101] rounded-3xl p-6 shadow-2xl overflow-y-auto animate-scale-in ${
              activeInfoCard === 'period' ? 'bg-gradient-to-br from-rose-400 to-pink-500' :
              activeInfoCard === 'ovulation' ? 'bg-gradient-to-br from-violet-400 to-purple-500' :
              'bg-gradient-to-br from-cyan-400 to-teal-400'
            }`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveInfoCard(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-[102] active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Period Info */}
            {activeInfoCard === 'period' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <svg className="w-14 h-14 animate-pulse" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="18" fill="white" opacity="0.9" />
                    <path d="M24 12c-4 6-10 10-10 16a10 10 0 1 0 20 0c0-6-6-10-10-16z" fill="#f43f5e" opacity="0.7" />
                    <circle cx="20" cy="22" r="3" fill="white" opacity="0.6" />
                  </svg>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{language === 'tr' ? 'Sonraki Regl' : 'Next Period'}</h3>
                    <p className="text-white/80">{format(parseISO(prediction.nextPeriodStart), 'd MMMM EEEE', { locale: language === 'tr' ? tr : undefined })}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2">📋 {language === 'tr' ? 'Ne Beklemeli?' : 'What to Expect?'}</h4>
                    <ul className="text-sm text-white/90 space-y-1">
                      <li>• {language === 'tr' ? 'Adet kanaması ortalama 3-7 gün sürer' : 'Period bleeding lasts 3-7 days on average'}</li>
                      <li>• {language === 'tr' ? 'İlk 1-2 gün akış daha yoğun olabilir' : 'Flow may be heavier in the first 1-2 days'}</li>
                      <li>• {language === 'tr' ? 'Kramp, yorgunluk ve ruh hali değişimleri normal' : 'Cramps, fatigue and mood changes are normal'}</li>
                    </ul>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2">💡 {language === 'tr' ? 'İpuçları' : 'Tips'}</h4>
                    <ul className="text-sm text-white/90 space-y-1">
                      <li>• {language === 'tr' ? 'Bol su için ve demir açısından zengin gıdalar tüketin' : 'Drink plenty of water and eat iron-rich foods'}</li>
                      <li>• {language === 'tr' ? 'Sıcak kompres ağrıları hafifletebilir' : 'A warm compress can relieve pain'}</li>
                      <li>• {language === 'tr' ? 'Hafif egzersiz ve yoga faydalı olabilir' : 'Light exercise and yoga can be helpful'}</li>
                    </ul>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleNavigateToCalendar(prediction.nextPeriodStart)}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <CalendarDays className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white text-sm">{language === 'tr' ? 'Takvimde Göster' : 'Show in Calendar'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      const success = await scheduleCustomReminder(
                        language === 'tr' ? 'Regl Yaklaşıyor' : 'Period Approaching',
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
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
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
                  <svg className="w-14 h-14 animate-ping" style={{ animationDuration: '2s' }} viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="16" fill="white" opacity="0.9" />
                    <circle cx="24" cy="24" r="10" fill="#a855f7" opacity="0.6" />
                    <circle cx="20" cy="20" r="4" fill="white" opacity="0.8" />
                  </svg>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{language === 'tr' ? 'Yumurtlama Günü' : 'Ovulation Day'}</h3>
                    <p className="text-white/80">{format(parseISO(prediction.ovulationDate), 'd MMMM EEEE', { locale: language === 'tr' ? tr : undefined })}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                        <circle cx="12" cy="12" r="5" fill="#a855f7" opacity="0.6" />
                      </svg>
                      {language === 'tr' ? 'Yumurtlama Nedir?' : 'What is Ovulation?'}
                    </h4>
                    <ul className="text-sm text-white/90 space-y-1">
                      <li>• {language === 'tr' ? 'Yumurtalıktan olgun bir yumurta salınır' : 'A mature egg is released from the ovary'}</li>
                      <li>• {language === 'tr' ? 'En verimli gününüz - hamilelik şansı en yüksek' : 'Your most fertile day - highest chance of pregnancy'}</li>
                      <li>• {language === 'tr' ? 'Yumurta 12-24 saat boyunca döllenebilir' : 'The egg can be fertilized for 12-24 hours'}</li>
                    </ul>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2">✨ {language === 'tr' ? 'Belirtiler' : 'Symptoms'}</h4>
                    <ul className="text-sm text-white/90 space-y-1">
                      <li>• {language === 'tr' ? 'Vücut sıcaklığında hafif artış' : 'Slight increase in body temperature'}</li>
                      <li>• {language === 'tr' ? 'Servikal mukus yumurta akı kıvamında' : 'Cervical mucus like egg white consistency'}</li>
                      <li>• {language === 'tr' ? 'Bazı kadınlarda hafif kasık ağrısı' : 'Some women may experience mild pelvic pain'}</li>
                    </ul>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleNavigateToCalendar(prediction.ovulationDate)}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <CalendarDays className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white text-sm">{language === 'tr' ? 'Takvimde Göster' : 'Show in Calendar'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      const success = await scheduleCustomReminder(
                        language === 'tr' ? 'Yumurtlama Günü' : 'Ovulation Day',
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
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <Bell className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* Fertile Window Info */}
            {activeInfoCard === 'fertile' && prediction && (() => {
              const ovulationDateParsed = parseISO(prediction.ovulationDate);
              const fertileStart = parseISO(prediction.fertileWindowStart);
              const fertileEnd = parseISO(prediction.fertileWindowEnd);
              const fertileDays = eachDayOfInterval({ start: fertileStart, end: fertileEnd });
              
              return (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <svg className="w-14 h-14 animate-bounce" style={{ animationDuration: '2s' }} viewBox="0 0 48 48" fill="none">
                      <path d="M24 44c-3-3-12-10-12-20a12 12 0 1 1 24 0c0 10-9 17-12 20z" fill="white" opacity="0.9" />
                      <path d="M24 38c-2-2-8-7-8-14a8 8 0 1 1 16 0c0 7-6 12-8 14z" fill="#14b8a6" opacity="0.5" />
                      <circle cx="20" cy="20" r="3" fill="white" opacity="0.8" />
                    </svg>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{language === 'tr' ? 'Doğurgan Dönem' : 'Fertile Window'}</h3>
                      <p className="text-white/80">
                        {format(fertileStart, 'd MMM', { locale: language === 'tr' ? tr : undefined })} - {format(fertileEnd, 'd MMM', { locale: language === 'tr' ? tr : undefined })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Fertile Days with Pregnancy Chances */}
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      📊 {language === 'tr' ? 'Günlük Hamilelik Şansı' : 'Daily Pregnancy Chance'}
                    </h4>
                    <div className="space-y-2">
                      {fertileDays.map((day) => {
                        const daysFromOvulation = differenceInDays(day, ovulationDateParsed);
                        const chance = getFertilityChance(daysFromOvulation);
                        const isOvulationDay = daysFromOvulation === 0;
                        
                        return (
                          <div key={day.toISOString()} className="flex items-center gap-3">
                            <div className="w-16 text-xs text-white/80">
                              {format(day, 'd MMM', { locale: language === 'tr' ? tr : undefined })}
                            </div>
                            <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isOvulationDay ? 'bg-gradient-to-r from-violet-400 to-purple-500' : 'bg-white/60'}`}
                                style={{ width: `${chance}%` }}
                              />
                            </div>
                            <div className={`w-10 text-right text-sm font-bold ${isOvulationDay ? 'text-white' : 'text-white/80'}`}>
                              {chance}%
                            </div>
                            {isOvulationDay && (
                              <span className="text-xs bg-violet-500/50 px-2 py-0.5 rounded-full text-white">
                                <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="8" fill="white" opacity="0.9" />
                                  <circle cx="12" cy="12" r="5" fill="#a855f7" opacity="0.6" />
                                </svg>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2">🎯 {language === 'tr' ? 'Önemli Bilgiler' : 'Important Info'}</h4>
                    <ul className="text-sm text-white/90 space-y-1">
                      <li>• {language === 'tr' ? 'Yumurtlama günü en yüksek şans (%33)' : 'Ovulation day has highest chance (33%)'}</li>
                      <li>• {language === 'tr' ? 'Sperm 5 güne kadar canlı kalabilir' : 'Sperm can survive up to 5 days'}</li>
                      <li>• {language === 'tr' ? 'Hamilelik istemiyorsanız korunma şart' : 'Use protection if you don\'t want pregnancy'}</li>
                    </ul>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNavigateToCalendar(prediction.fertileWindowStart)}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                      <CalendarDays className="w-5 h-5 text-white" />
                      <span className="font-semibold text-white text-sm">{language === 'tr' ? 'Takvimde Göster' : 'Show in Calendar'}</span>
                    </button>
                    <button
                      onClick={async () => {
                        const success = await scheduleCustomReminder(
                          language === 'tr' ? 'Doğurgan Dönem Başlıyor' : 'Fertile Window Starting',
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
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                      <Bell className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </>
  );
}
