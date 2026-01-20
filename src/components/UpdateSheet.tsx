// 🌸 Update Bottom Sheet Component - Flo Inspired Categorized Design
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent
} from '@/components/ui/sheet';
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

// Extended types for more categories
type VaginalDischarge = 'none' | 'slippery' | 'watery' | 'sticky' | 'egg_white' | 'spotting' | 'unusual' | 'white_clumpy' | 'gray';
type Digestion = 'nausea' | 'bloating' | 'constipation' | 'diarrhea';
type Activity = 'none' | 'yoga' | 'weights' | 'aerobics' | 'swimming' | 'team_sports' | 'running' | 'cycling' | 'walking';

// Category data structures
const CATEGORIES = {
  mood: {
    title: { tr: 'Ruh hali', en: 'Mood' },
    color: 'amber',
    bgColor: 'bg-amber-50',
    chipBg: 'bg-amber-100',
    chipSelected: 'bg-amber-400',
    items: [
      { id: 'calm', emoji: '😌', tr: 'Sakinim', en: 'Calm' },
      { id: 'happy', emoji: '🙂', tr: 'Mutluyum', en: 'Happy' },
      { id: 'energetic', emoji: '🤩', tr: 'Enerjiğim', en: 'Energetic' },
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
  symptoms: {
    title: { tr: 'Belirtiler', en: 'Symptoms' },
    color: 'pink',
    bgColor: 'bg-pink-50',
    chipBg: 'bg-pink-100',
    chipSelected: 'bg-pink-400',
    items: [
      { id: 'all_good', emoji: '👍', tr: 'Her şey yolunda', en: 'All good' },
      { id: 'cramps', emoji: '🎯', tr: 'Kramp', en: 'Cramps' },
      { id: 'breast_tenderness', emoji: '🎯', tr: 'Göğüs Hassasiyeti', en: 'Breast tenderness' },
      { id: 'headache', emoji: '👩🏽', tr: 'Baş Ağrısı', en: 'Headache' },
      { id: 'acne', emoji: '👋🏼', tr: 'Akne', en: 'Acne' },
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
    color: 'purple',
    bgColor: 'bg-purple-50',
    chipBg: 'bg-purple-100',
    chipSelected: 'bg-purple-400',
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
    color: 'rose',
    bgColor: 'bg-rose-50',
    chipBg: 'bg-rose-100',
    chipSelected: 'bg-rose-400',
    items: [
      { id: 'nausea', emoji: '🤢', tr: 'Bulantı', en: 'Nausea' },
      { id: 'bloating', emoji: '🎈', tr: 'Şişkinlik', en: 'Bloating' },
      { id: 'constipation', emoji: '🔵', tr: 'Kabızlık', en: 'Constipation' },
      { id: 'diarrhea', emoji: '💧', tr: 'İshal', en: 'Diarrhea' },
    ]
  },
  activity: {
    title: { tr: 'Fiziksel aktivite', en: 'Physical activity' },
    color: 'green',
    bgColor: 'bg-green-50',
    chipBg: 'bg-green-100',
    chipSelected: 'bg-green-500',
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
    color: 'orange',
    bgColor: 'bg-orange-50',
    chipBg: 'bg-orange-100',
    chipSelected: 'bg-orange-400',
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
  flow: {
    title: { tr: 'Adet akışı', en: 'Period flow' },
    color: 'rose',
    bgColor: 'bg-rose-50',
    chipBg: 'bg-rose-100',
    chipSelected: 'bg-rose-500',
    items: [
      { id: 'none', emoji: '⚪', tr: 'Yok', en: 'None' },
      { id: 'spotting', emoji: '🩸', tr: 'Lekelenme', en: 'Spotting' },
      { id: 'light', emoji: '💧', tr: 'Hafif', en: 'Light' },
      { id: 'medium', emoji: '💧💧', tr: 'Orta', en: 'Medium' },
      { id: 'heavy', emoji: '💧💧💧', tr: 'Yoğun', en: 'Heavy' },
    ]
  }
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states
  const [flowLevel, setFlowLevel] = useState<FlowLevel>('none');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedDischarge, setSelectedDischarge] = useState<string[]>([]);
  const [selectedDigestion, setSelectedDigestion] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string[]>([]);
  const [selectedOther, setSelectedOther] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentDate(initialDate);
      setSearchQuery('');
      if (existingEntry) {
        setFlowLevel(existingEntry.flowLevel);
        setSelectedSymptoms(existingEntry.symptoms);
        setSelectedMoods(existingEntry.mood ? [existingEntry.mood] : []);
        setNotes(existingEntry.notes || '');
        // Reset extended categories
        setSelectedDischarge([]);
        setSelectedDigestion([]);
        setSelectedActivity([]);
        setSelectedOther([]);
      } else {
        setFlowLevel('none');
        setSelectedSymptoms([]);
        setSelectedMoods([]);
        setSelectedDischarge([]);
        setSelectedDigestion([]);
        setSelectedActivity([]);
        setSelectedOther([]);
        setNotes('');
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
    id: string, 
    selected: string[], 
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    singleSelect = false
  ) => {
    if (singleSelect) {
      setSelected([id]);
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
      symptoms: selectedSymptoms as Symptom[],
      mood: selectedMoods[0] as Mood | undefined,
      notes: notes.trim() || undefined,
    };
    onSave(entry);
    onClose();
  };

  const goToPreviousDay = () => setCurrentDate(prev => subDays(prev, 1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));

  // Filter items based on search
  const filterItems = (items: typeof CATEGORIES.mood.items) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.tr.toLowerCase().includes(query) || 
      item.en.toLowerCase().includes(query)
    );
  };

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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-4 shadow-sm border border-border/30"
      >
        <h3 className="font-semibold text-foreground mb-3 text-base">
          {language === 'tr' ? category.title.tr : category.title.en}
        </h3>
        <div className="flex flex-wrap gap-2">
          {filteredItems.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => toggleSelection(item.id, selected, setSelected, singleSelect)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? `${category.chipSelected} text-white shadow-md`
                    : `${category.chipBg} text-foreground/80 hover:opacity-80`
                }`}
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{language === 'tr' ? item.tr : item.en}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
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
      >
        <div className="flex flex-col h-full bg-muted/30">
          {/* Header with Date Navigation */}
          <div className="bg-card border-b border-border/30 px-4 pt-4 pb-3 rounded-t-[2rem]">
            {/* Drag Handle */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-50 active:scale-90 transition-transform"
            >
              <X className="w-6 h-6 text-foreground/70" />
            </button>

            {/* Date Navigation */}
            <div className="flex items-center justify-between px-8 mb-4">
              <motion.button
                type="button"
                onClick={goToPreviousDay}
                className="p-2 rounded-full hover:bg-muted active:scale-90 transition-all"
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6 text-foreground/60" />
              </motion.button>
              
              <motion.h2 
                className="text-lg font-semibold text-foreground"
                key={currentDate.toISOString()}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {format(currentDate, 'd MMMM', { locale: language === 'tr' ? tr : undefined })}
              </motion.h2>
              
              <motion.button
                type="button"
                onClick={goToNextDay}
                className="p-2 rounded-full hover:bg-muted active:scale-90 transition-all"
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-6 h-6 text-foreground/60" />
              </motion.button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'tr' ? 'Arama' : 'Search'}
                className="pl-12 h-12 rounded-2xl bg-muted/50 border-0 text-base"
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4 pb-24">
              {/* Flow Category */}
              <CategoryCard 
                category={CATEGORIES.flow}
                selected={[flowLevel]}
                setSelected={(val) => {
                  const newVal = typeof val === 'function' ? val([flowLevel]) : val;
                  setFlowLevel(newVal[0] as FlowLevel || 'none');
                }}
                singleSelect
              />

              {/* Mood Category */}
              <CategoryCard 
                category={CATEGORIES.mood}
                selected={selectedMoods}
                setSelected={setSelectedMoods}
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

              {/* Notes Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📝</span>
                  <h3 className="font-semibold text-foreground text-base">
                    {language === 'tr' ? 'Notlar' : 'Notes'}
                  </h3>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'tr' ? 'Bugün hakkında bir şeyler yaz...' : 'Write something about today...'}
                  className="rounded-xl resize-none border-border/50 focus:border-primary min-h-[100px] bg-muted/30"
                  rows={4}
                />
              </motion.div>
            </div>
          </ScrollArea>

          {/* Fixed Save Button */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-gradient-to-t from-card via-card to-transparent safe-area-bottom">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                size="lg"
                className="w-full rounded-2xl h-14 text-white font-semibold shadow-lg bg-gradient-to-r from-rose-400 to-pink-500"
              >
                <Check className="w-5 h-5 mr-2" />
                {language === 'tr' ? 'Kaydet' : 'Save'}
              </Button>
            </motion.div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
