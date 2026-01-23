// 🌸 Update Bottom Sheet Component - Flo Inspired Categorized Design
import { useState, useEffect } from 'react';
import { X, Check, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { DayEntry, FlowLevel, Symptom, Mood } from '@/types/cycle';
import { format, addDays, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { App } from '@capacitor/app';

interface UpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: DayEntry) => void;
  existingEntry?: DayEntry | null;
  date?: Date;
  language?: 'tr' | 'en';
  initialTab?: 'flow' | 'symptoms' | 'mood';
}

// Category data structures with proper colors using semantic tokens
const CATEGORIES = {
  flow: {
    title: { tr: 'Adet akışı', en: 'Period flow' },
    bgClass: 'bg-rose-light dark:bg-rose/20',
    chipBase: 'bg-rose-light dark:bg-rose/30 text-rose dark:text-rose-light',
    chipSelected: 'bg-rose text-white',
    items: [
      { id: 'none', emoji: '⚪', tr: 'Yok', en: 'None' },
      { id: 'spotting', emoji: '🩸', tr: 'Lekelenme', en: 'Spotting' },
      { id: 'light', emoji: '💧', tr: 'Hafif', en: 'Light' },
      { id: 'medium', emoji: '💧💧', tr: 'Orta', en: 'Medium' },
      { id: 'heavy', emoji: '💧💧💧', tr: 'Yoğun', en: 'Heavy' },
    ]
  },
  mood: {
    title: { tr: 'Ruh hali', en: 'Mood' },
    bgClass: 'bg-amber-light dark:bg-amber/20',
    chipBase: 'bg-amber-light dark:bg-amber/30 text-amber dark:text-amber-light',
    chipSelected: 'bg-amber text-white',
    items: [
      { id: 'calm', emoji: '😌', tr: 'Sakinim', en: 'Calm' },
      { id: 'happy', emoji: '🙂', tr: 'Mutluyum', en: 'Happy' },
      { id: 'energetic', emoji: '🤩', tr: 'Enerjİğim', en: 'Energetic' },
      { id: 'playful', emoji: '😋', tr: 'Cıvıl cıvılım', en: 'Playful' },
      { id: 'moody', emoji: '🥺', tr: 'Ruh halim dengesiz', en: 'Moody' },
      { id: 'irritable', emoji: '😣', tr: 'Rahatsız hissediyorum', en: 'Irritable' },
      { id: 'sad', emoji: '😔', tr: 'Üzgünüm', en: 'Sad' },
      { id: 'anxious', emoji: '😟', tr: 'Endişeliyim', en: 'Anxious' },
      { id: 'depressed', emoji: '😑', tr: 'Depresifim', en: 'Depressed' },
      { id: 'guilty', emoji: '😥', tr: 'Suçluluk hissediyorum', en: 'Guilty' },
      { id: 'obsessive', emoji: '🤔', tr: 'Obsesif düşünceler', en: 'Obsessive' },
      { id: 'low_energy', emoji: '😫', tr: 'Enerjim düşük', en: 'Low energy' },
      { id: 'numb', emoji: '😶', tr: 'Hissizim', en: 'Numb' },
      { id: 'confused', emoji: '😐', tr: 'Aklım karışık', en: 'Confused' },
      { id: 'self_critical', emoji: '🤦', tr: 'Kendimi çok eleştiriyorum', en: 'Self-critical' },
    ]
  },
  sexual: {
    title: { tr: 'Cinsel ilişki ve cinsel ilişki isteği', en: 'Sex & sex drive' },
    bgClass: 'bg-pink-light dark:bg-pink/20',
    chipBase: 'bg-pink-light dark:bg-pink/30 text-pink dark:text-pink-light',
    chipSelected: 'bg-pink text-white',
    items: [
      { id: 'no_sex', emoji: '💔', tr: 'Yapmadım', en: 'Did not have sex' },
      { id: 'protected', emoji: '❤️', tr: 'Korunmalı cinsel ilişki', en: 'Protected sex' },
      { id: 'unprotected', emoji: '💗', tr: 'Korunmasız cinsel ilişki', en: 'Unprotected sex' },
      { id: 'oral', emoji: '💋', tr: 'Oral seks', en: 'Oral sex' },
      { id: 'anal', emoji: '❣️', tr: 'Anal seks', en: 'Anal sex' },
      { id: 'masturbation', emoji: '💕', tr: 'Mastürbasyon', en: 'Masturbation' },
      { id: 'touching', emoji: '💞', tr: 'Haz veren dokunma', en: 'Intimate touching' },
      { id: 'toys', emoji: '💝', tr: 'Seks oyuncakları', en: 'Sex toys' },
      { id: 'orgasm', emoji: '✨', tr: 'Orgazm', en: 'Orgasm' },
      { id: 'high_drive', emoji: '❤️', tr: 'Yüksek cinsel istek', en: 'High sex drive' },
      { id: 'neutral_drive', emoji: '🧡', tr: 'Nötr seviyede cinsel istek', en: 'Neutral sex drive' },
      { id: 'low_drive', emoji: '💛', tr: 'Düşük seviyede cinsel istek', en: 'Low sex drive' },
    ]
  },
  symptoms: {
    title: { tr: 'Belirtiler', en: 'Symptoms' },
    bgClass: 'bg-pink-light dark:bg-pink/20',
    chipBase: 'bg-pink-light dark:bg-pink/30 text-pink dark:text-pink-light',
    chipSelected: 'bg-pink text-white',
    items: [
      { id: 'all_good', emoji: '👍', tr: 'Her şey yolunda', en: 'All good' },
      { id: 'cramps', emoji: '🎯', tr: 'Kramp', en: 'Cramps' },
      { id: 'breast_tenderness', emoji: '🎯', tr: 'Göğüs Hassasiyeti', en: 'Breast tenderness' },
      { id: 'headache', emoji: '🤕', tr: 'Baş Ağrısı', en: 'Headache' },
      { id: 'acne', emoji: '😖', tr: 'Akne', en: 'Acne' },
      { id: 'backache', emoji: '🎯', tr: 'Bel Ağrısı', en: 'Back pain' },
      { id: 'fatigue', emoji: '🔋', tr: 'Halsizlik', en: 'Fatigue' },
      { id: 'cravings', emoji: '🧁', tr: 'Aşermeler', en: 'Cravings' },
      { id: 'insomnia', emoji: '💤', tr: 'Uykusuzluk', en: 'Insomnia' },
      { id: 'abdominal_pain', emoji: '🎯', tr: 'Karın ağrısı', en: 'Abdominal pain' },
      { id: 'vaginal_itching', emoji: '🌸', tr: 'Vajinada kaşınma', en: 'Vaginal itching' },
      { id: 'vaginal_dryness', emoji: '🌸', tr: 'Vajina kuruluğu', en: 'Vaginal dryness' },
    ]
  },
  discharge: {
    title: { tr: 'Vajinal akıntı', en: 'Vaginal discharge' },
    bgClass: 'bg-violet-light dark:bg-violet/20',
    chipBase: 'bg-violet-light dark:bg-violet/30 text-violet dark:text-violet-light',
    chipSelected: 'bg-violet text-white',
    items: [
      { id: 'none', emoji: '🚫', tr: 'Akıntı yok', en: 'No discharge' },
      { id: 'slippery', emoji: '💧', tr: 'Kaygan', en: 'Slippery' },
      { id: 'watery', emoji: '💦', tr: 'Sulu', en: 'Watery' },
      { id: 'sticky', emoji: '💧', tr: 'Yapışkan', en: 'Sticky' },
      { id: 'egg_white', emoji: '💧', tr: 'Yumurta akı', en: 'Egg white' },
      { id: 'spotting', emoji: '🩸', tr: 'Lekelenme', en: 'Spotting' },
      { id: 'unusual', emoji: '👤', tr: 'Olağandışı', en: 'Unusual' },
      { id: 'white_clumpy', emoji: '⚪', tr: 'Beyaz, topaklı', en: 'White, clumpy' },
      { id: 'gray', emoji: '⬛', tr: 'Gri', en: 'Gray' },
    ]
  },
  digestion: {
    title: { tr: 'Sindirim ve dışkı', en: 'Digestion' },
    bgClass: 'bg-rose-light dark:bg-rose/20',
    chipBase: 'bg-rose-light dark:bg-rose/30 text-rose dark:text-rose-light',
    chipSelected: 'bg-rose text-white',
    items: [
      { id: 'nausea', emoji: '🤢', tr: 'Bulantı', en: 'Nausea' },
      { id: 'bloating', emoji: '🎈', tr: 'Şişkinlik', en: 'Bloating' },
      { id: 'constipation', emoji: '🔵', tr: 'Kabızlık', en: 'Constipation' },
      { id: 'diarrhea', emoji: '💧', tr: 'İshal', en: 'Diarrhea' },
    ]
  },
  pregnancy_test: {
    title: { tr: 'Gebelik testi', en: 'Pregnancy test' },
    bgClass: 'bg-orange-light dark:bg-orange/20',
    chipBase: 'bg-orange-light dark:bg-orange/30 text-orange dark:text-orange-light',
    chipSelected: 'bg-orange text-white',
    items: [
      { id: 'not_taken', emoji: '🚫', tr: 'Test yapmadım', en: 'Did not take test' },
      { id: 'positive', emoji: '➕', tr: 'Pozitif', en: 'Positive' },
      { id: 'negative', emoji: '➖', tr: 'Negatif', en: 'Negative' },
      { id: 'faint_line', emoji: '〰️', tr: 'Soluk çizgi', en: 'Faint line' },
    ]
  },
  ovulation_test: {
    title: { tr: 'Ovülasyon testi', en: 'Ovulation test' },
    subtitle: { tr: 'Ovülasyon zamanınızı öğrenmek için kaydedin', en: 'Track to learn your ovulation time' },
    bgClass: 'bg-teal-light dark:bg-teal/20',
    chipBase: 'bg-teal-light dark:bg-teal/30 text-teal dark:text-teal-light',
    chipSelected: 'bg-teal text-white',
    items: [
      { id: 'not_taken', emoji: '🚫', tr: 'Test yapmadım', en: 'Did not take test' },
      { id: 'positive', emoji: '➕', tr: 'Test: pozitif', en: 'Test: positive' },
      { id: 'negative', emoji: '➖', tr: 'Test: negatif', en: 'Test: negative' },
      { id: 'own_method', emoji: '📊', tr: 'Ovülasyon: kendi yöntemim', en: 'Ovulation: my own method' },
    ]
  },
  activity: {
    title: { tr: 'Fiziksel aktivite', en: 'Physical activity' },
    bgClass: 'bg-green-light dark:bg-green/20',
    chipBase: 'bg-green-light dark:bg-green/30 text-green dark:text-green-light',
    chipSelected: 'bg-green text-white',
    items: [
      { id: 'none', emoji: '🚫', tr: 'Egzersiz yapmadım', en: 'No exercise' },
      { id: 'yoga', emoji: '🧘', tr: 'Yoga', en: 'Yoga' },
      { id: 'weights', emoji: '💪', tr: 'Ağırlık', en: 'Weights' },
      { id: 'aerobics', emoji: '🎵', tr: 'Aerobik ve dans', en: 'Aerobics' },
      { id: 'swimming', emoji: '🏊', tr: 'Yüzme', en: 'Swimming' },
      { id: 'team_sports', emoji: '⚽', tr: 'Takım sporları', en: 'Team sports' },
      { id: 'running', emoji: '🏃', tr: 'Koşu', en: 'Running' },
      { id: 'cycling', emoji: '🚴', tr: 'Bisiklet', en: 'Cycling' },
      { id: 'walking', emoji: '🚶', tr: 'Yürüyüş', en: 'Walking' },
    ]
  },
  other: {
    title: { tr: 'Diğer', en: 'Other' },
    bgClass: 'bg-orange-light dark:bg-orange/20',
    chipBase: 'bg-orange-light dark:bg-orange/30 text-orange dark:text-orange-light',
    chipSelected: 'bg-orange text-white',
    items: [
      { id: 'travel', emoji: '📍', tr: 'Seyahat', en: 'Travel' },
      { id: 'stress', emoji: '⚡', tr: 'Stres', en: 'Stress' },
      { id: 'meditation', emoji: '🧘', tr: 'Meditasyon', en: 'Meditation' },
      { id: 'journal', emoji: '📒', tr: 'Günlük tutma', en: 'Journal' },
      { id: 'kegel', emoji: '💪', tr: 'Kegel egzersizleri', en: 'Kegel exercises' },
      { id: 'breathing', emoji: '🫁', tr: 'Nefes egzersizleri', en: 'Breathing exercises' },
      { id: 'illness', emoji: '🤒', tr: 'Hastalık veya İncinme', en: 'Illness or injury' },
      { id: 'alcohol', emoji: '🍷', tr: 'Alkol', en: 'Alcohol' },
    ]
  },
};

export function UpdateSheet({ 
  isOpen, 
  onClose, 
  onSave, 
  existingEntry,
  date: initialDate = new Date(),
  language = 'tr',
  initialTab = 'flow'
}: UpdateSheetProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  
  // Selection states
  const [flowLevel, setFlowLevel] = useState<FlowLevel>('none');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSexual, setSelectedSexual] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedDischarge, setSelectedDischarge] = useState<string[]>([]);
  const [selectedDigestion, setSelectedDigestion] = useState<string[]>([]);
  const [selectedPregnancyTest, setSelectedPregnancyTest] = useState<string[]>([]);
  const [selectedOvulationTest, setSelectedOvulationTest] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string[]>([]);
  const [selectedOther, setSelectedOther] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // Water and Weight tracking
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [weight, setWeight] = useState<number | null>(null);
  const waterGoal = 2.25; // Liters

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentDate(initialDate);
      if (existingEntry) {
        setFlowLevel(existingEntry.flowLevel);
        setSelectedSymptoms(existingEntry.symptoms || []);
        setSelectedMoods(existingEntry.mood ? [existingEntry.mood] : []);
        setNotes(existingEntry.notes || '');
        // Load extended data
        setSelectedSexual(existingEntry.sexualActivity || []);
        setSelectedDischarge(existingEntry.discharge || []);
        setSelectedDigestion(existingEntry.digestion || []);
        setSelectedPregnancyTest(existingEntry.pregnancyTest ? [existingEntry.pregnancyTest] : []);
        setSelectedOvulationTest(existingEntry.ovulationTest ? [existingEntry.ovulationTest] : []);
        setSelectedActivity(existingEntry.activity || []);
        setSelectedOther(existingEntry.other || []);
        setWaterGlasses(existingEntry.waterGlasses || 0);
        setWeight(existingEntry.weight || null);
      } else {
        setFlowLevel('none');
        setSelectedSymptoms([]);
        setSelectedMoods([]);
        setNotes('');
        setSelectedSexual([]);
        setSelectedDischarge([]);
        setSelectedDigestion([]);
        setSelectedPregnancyTest([]);
        setSelectedOvulationTest([]);
        setSelectedActivity([]);
        setSelectedOther([]);
        setWaterGlasses(0);
        setWeight(null);
      }
    }
  }, [isOpen, existingEntry, initialDate]);

  // Handle Android back button
  useEffect(() => {
    if (!isOpen) return;
    
    const backHandler = App.addListener('backButton', () => {
      onClose();
    });
    
    return () => {
      backHandler.then(handler => handler.remove());
    };
  }, [isOpen, onClose]);

  const toggleSelection = (
    e: React.MouseEvent,
    id: string, 
    selected: string[], 
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    singleSelect = false
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (singleSelect) {
      setSelected(prev => prev.includes(id) ? [] : [id]);
    } else {
      setSelected(prev => 
        prev.includes(id) 
          ? prev.filter(s => s !== id)
          : [...prev, id]
      );
    }
  };

  const handleSave = () => {
    const entry: DayEntry = {
      date: format(currentDate, 'yyyy-MM-dd'),
      flowLevel,
      symptoms: selectedSymptoms,
      mood: selectedMoods[0] || undefined,
      notes: notes.trim() || undefined,
      intimacy: selectedSexual.length > 0,
      protection: selectedSexual.includes('protected'),
      testResult: selectedPregnancyTest.includes('positive') ? 'positive' : 
                  selectedPregnancyTest.includes('negative') ? 'negative' : null,
      // Extended data
      sexualActivity: selectedSexual.length > 0 ? selectedSexual : undefined,
      discharge: selectedDischarge.length > 0 ? selectedDischarge : undefined,
      digestion: selectedDigestion.length > 0 ? selectedDigestion : undefined,
      pregnancyTest: selectedPregnancyTest[0] || undefined,
      ovulationTest: selectedOvulationTest[0] || undefined,
      activity: selectedActivity.length > 0 ? selectedActivity : undefined,
      other: selectedOther.length > 0 ? selectedOther : undefined,
      waterGlasses: waterGlasses > 0 ? waterGlasses : undefined,
      weight: weight || undefined,
    };
    onSave(entry);
    onClose();
  };

  const goToPreviousDay = () => setCurrentDate(prev => subDays(prev, 1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));

  // Filter items - no search, always return all
  const filterItems = (items: typeof CATEGORIES.mood.items) => items;

  // Category Card Component
  const CategoryCard = ({ 
    category, 
    selected, 
    setSelected,
    singleSelect = false
  }: { 
    category: typeof CATEGORIES.mood;
    selected: string[];
    setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    singleSelect?: boolean;
  }) => {
    const filteredItems = filterItems(category.items);
    if (filteredItems.length === 0) return null;

    return (
      <div className="bg-card rounded-xl p-3 shadow-sm border border-border/40">
        <h3 className="font-medium text-foreground mb-2 text-sm">
          {language === 'tr' ? category.title.tr : category.title.en}
        </h3>
        {'subtitle' in category && category.subtitle && (
          <p className="text-xs text-muted-foreground mb-2 -mt-1">
            {language === 'tr' ? (category.subtitle as {tr: string; en: string}).tr : (category.subtitle as {tr: string; en: string}).en}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {filteredItems.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => toggleSelection(e, item.id, selected, setSelected, singleSelect)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                  isSelected
                    ? `${category.chipSelected} shadow-sm`
                    : `${category.chipBase} hover:opacity-80`
                }`}
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span className="text-sm">{item.emoji}</span>
                <span className="whitespace-nowrap">{language === 'tr' ? item.tr : item.en}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Water Tracking Card
  const WaterCard = () => (
    <div className="bg-card rounded-xl p-3 shadow-sm border border-border/40">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💧</span>
          <span className="font-medium text-foreground text-sm">{language === 'tr' ? 'Su' : 'Water'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWaterGlasses(prev => Math.max(0, prev - 1));
            }}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
          >
            <Minus className="w-4 h-4 text-foreground/70" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWaterGlasses(prev => prev + 1);
            }}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus className="w-4 h-4 text-foreground/70" />
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{(waterGlasses * 0.25).toFixed(2).replace('.', ',')}</span>
        <span className="text-sm text-muted-foreground">/ {waterGoal.toFixed(2).replace('.', ',')} L</span>
      </div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-sky rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, (waterGlasses * 0.25 / waterGoal) * 100)}%` }}
        />
      </div>
    </div>
  );

  // Weight Card - with +/- controls like water
  const WeightCard = () => {
    const incrementWeight = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWeight(prev => (prev ?? 60) + 0.1);
    };
    
    const decrementWeight = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setWeight(prev => Math.max(30, (prev ?? 60) - 0.1));
    };

    const displayWeight = weight !== null ? weight.toFixed(1) : null;

    return (
      <div className="bg-card rounded-xl p-3 shadow-sm border border-border/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">⚖️</span>
            <span className="font-medium text-foreground text-sm">{language === 'tr' ? 'Ağırlık' : 'Weight'}</span>
          </div>
          <button
            type="button"
            onClick={() => setWeight(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {language === 'tr' ? 'Temizle' : 'Clear'}
          </button>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={decrementWeight}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform text-lg font-bold text-foreground/70"
          >
            −
          </button>
          <div className="flex items-baseline gap-1 min-w-[80px] justify-center">
            <span className="text-3xl font-bold text-foreground">
              {displayWeight ?? '--'}
            </span>
            <span className="text-base text-muted-foreground">kg</span>
          </div>
          <button
            type="button"
            onClick={incrementWeight}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform text-lg font-bold text-foreground/70"
          >
            +
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {language === 'tr' ? '0.1 kg artış/azalış' : '0.1 kg increment'}
        </p>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={() => {}}>
      <SheetContent 
        side="bottom" 
        className="h-[92vh] rounded-t-[2rem] p-0 border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Prevent Radix auto-focus from scrolling the underlying page (common on mobile)
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden.Root>
          <SheetTitle>Günlük Kayıt</SheetTitle>
          <SheetDescription>Bugünkü sağlık verilerinizi kaydedin</SheetDescription>
        </VisuallyHidden.Root>
        
        <div className="flex flex-col h-full bg-muted/30">
          {/* Header with Date Navigation - Pull to dismiss */}
          <div 
            className="bg-card border-b border-border/30 px-4 pt-4 pb-3 rounded-t-[2rem] cursor-grab active:cursor-grabbing touch-pan-y"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.startY = String(touch.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const startY = Number((e.currentTarget as HTMLElement).dataset.startY || 0);
              const deltaY = touch.clientY - startY;
              if (deltaY > 0) {
                (e.currentTarget as HTMLElement).style.transform = `translateY(${Math.min(deltaY * 0.5, 60)}px)`;
                (e.currentTarget as HTMLElement).style.opacity = String(1 - deltaY / 300);
              }
            }}
            onTouchEnd={(e) => {
              const startY = Number((e.currentTarget as HTMLElement).dataset.startY || 0);
              const endY = e.changedTouches[0].clientY;
              const deltaY = endY - startY;
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.opacity = '';
              if (deltaY > 80) {
                onClose();
              }
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Close button - moved to right */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50 active:scale-90 transition-transform"
            >
              <X className="w-6 h-6 text-foreground/70" />
            </button>

            {/* Date Navigation */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <button
                type="button"
                onClick={goToPreviousDay}
                className="p-2 rounded-full hover:bg-muted active:scale-90 transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-foreground/60" />
              </button>
              
              <h2 className="text-lg font-semibold text-foreground">
                {format(currentDate, 'd MMMM', { locale: language === 'tr' ? tr : undefined })}
              </h2>
              
              <button
                type="button"
                onClick={goToNextDay}
                className="p-2 rounded-full hover:bg-muted active:scale-90 transition-all"
              >
                <ChevronRight className="w-6 h-6 text-foreground/60" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-3">
            <div className="py-3 space-y-2.5 pb-24">
              {/* Flow Category */}
              <CategoryCard 
                category={CATEGORIES.flow}
                selected={[flowLevel]}
                setSelected={(val) => {
                  const newVal = typeof val === 'function' ? val([flowLevel]) : val;
                  setFlowLevel((newVal[0] as FlowLevel) || 'none');
                }}
                singleSelect
              />

              {/* Mood Category */}
              <CategoryCard 
                category={CATEGORIES.mood}
                selected={selectedMoods}
                setSelected={setSelectedMoods}
              />

              {/* Sexual Activity Category */}
              <CategoryCard 
                category={CATEGORIES.sexual}
                selected={selectedSexual}
                setSelected={setSelectedSexual}
              />

              {/* Symptoms Category */}
              <CategoryCard 
                category={CATEGORIES.symptoms}
                selected={selectedSymptoms}
                setSelected={setSelectedSymptoms}
              />

              {/* Discharge Category */}
              <CategoryCard 
                category={CATEGORIES.discharge}
                selected={selectedDischarge}
                setSelected={setSelectedDischarge}
              />

              {/* Digestion Category */}
              <CategoryCard 
                category={CATEGORIES.digestion}
                selected={selectedDigestion}
                setSelected={setSelectedDigestion}
              />

              {/* Pregnancy Test Category */}
              <CategoryCard 
                category={CATEGORIES.pregnancy_test}
                selected={selectedPregnancyTest}
                setSelected={setSelectedPregnancyTest}
                singleSelect
              />

              {/* Ovulation Test Category */}
              <CategoryCard 
                category={CATEGORIES.ovulation_test}
                selected={selectedOvulationTest}
                setSelected={setSelectedOvulationTest}
                singleSelect
              />

              {/* Activity Category */}
              <CategoryCard 
                category={CATEGORIES.activity}
                selected={selectedActivity}
                setSelected={setSelectedActivity}
              />

              {/* Other Category */}
              <CategoryCard 
                category={CATEGORIES.other}
                selected={selectedOther}
                setSelected={setSelectedOther}
              />

              {/* Water Tracking */}
              <WaterCard />

              {/* Weight Tracking */}
              <WeightCard />

              {/* Notes Section */}
              <div className="bg-card rounded-xl p-3 shadow-sm border border-border/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">📝</span>
                  <h3 className="font-medium text-foreground text-sm">
                    {language === 'tr' ? 'Notlar' : 'Notes'}
                  </h3>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'tr' ? 'Bugün hakkında bir şeyler yaz...' : 'Write something about today...'}
                  className="rounded-lg resize-none border-border/40 focus:border-primary min-h-[70px] bg-muted/30 text-sm"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Fixed Save Button */}
          <div className="absolute bottom-0 left-0 right-0 px-3 py-3 bg-gradient-to-t from-card via-card to-transparent safe-area-bottom">
            <div className="active:scale-[0.98] transition-transform">
              <Button
                onClick={handleSave}
                size="lg"
                className="w-full rounded-xl h-12 text-white font-semibold shadow-lg bg-gradient-to-r from-rose to-pink"
              >
                <Check className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Kaydet' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
