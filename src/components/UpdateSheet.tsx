// 🌸 Update Bottom Sheet Component - Flo Inspired Design
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent
} from '@/components/ui/sheet';
import type { DayEntry, FlowLevel, Symptom, Mood } from '@/types/cycle';
import { FLOW_LABELS, SYMPTOM_LABELS, MOOD_LABELS } from '@/types/cycle';
import { format } from 'date-fns';
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

const flowLevels: FlowLevel[] = ['none', 'spotting', 'light', 'medium', 'heavy'];
const symptoms: Symptom[] = [
  'cramps', 'headache', 'backache', 'bloating', 'breast_tenderness',
  'acne', 'fatigue', 'nausea', 'insomnia', 'hot_flashes',
  'dizziness', 'appetite_change', 'cravings', 'constipation', 'diarrhea'
];
const moods: Mood[] = ['happy', 'calm', 'sad', 'anxious', 'irritable', 'energetic', 'tired', 'neutral'];

export function UpdateSheet({ 
  isOpen, 
  onClose, 
  onSave, 
  existingEntry,
  date = new Date(),
  language = 'tr',
  initialTab = 'flow'
}: UpdateSheetProps) {
  const [activeTab, setActiveTab] = useState<'flow' | 'symptoms' | 'mood'>(initialTab);
  const [flowLevel, setFlowLevel] = useState<FlowLevel>('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>();
  const [notes, setNotes] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (existingEntry) {
        setFlowLevel(existingEntry.flowLevel);
        setSelectedSymptoms(existingEntry.symptoms);
        setSelectedMood(existingEntry.mood);
        setNotes(existingEntry.notes || '');
      } else {
        setFlowLevel('none');
        setSelectedSymptoms([]);
        setSelectedMood(undefined);
        setNotes('');
      }
    }
  }, [isOpen, existingEntry, initialTab]);

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

  const toggleSymptom = (symptom: Symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = () => {
    const entry: DayEntry = {
      date: format(date, 'yyyy-MM-dd'),
      flowLevel,
      symptoms: selectedSymptoms,
      mood: selectedMood,
      notes: notes.trim() || undefined,
    };
    onSave(entry);
    onClose();
  };

  const tabs = [
    { id: 'flow', label: language === 'tr' ? 'Akış' : 'Flow', icon: '🩸', gradient: 'from-rose-400 to-pink-500' },
    { id: 'symptoms', label: language === 'tr' ? 'Semptomlar' : 'Symptoms', icon: '💊', gradient: 'from-violet-400 to-purple-500' },
    { id: 'mood', label: language === 'tr' ? 'Ruh Hali' : 'Mood', icon: '😊', gradient: 'from-amber-400 to-orange-400' },
  ] as const;

  return (
    <Sheet open={isOpen} onOpenChange={() => {}}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-[2rem] p-0 border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          {/* Gradient Header */}
          <div className={`relative overflow-hidden bg-gradient-to-r ${tabs.find(t => t.id === activeTab)?.gradient} px-6 pt-6 pb-8`}>
            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"
              animate={{ scale: [1.1, 1, 1.1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Date */}
            <div className="relative">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white/80 text-sm"
              >
                {language === 'tr' ? 'Kayıt Tarihi' : 'Log Date'}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white"
              >
                {format(date, 'd MMMM yyyy', { locale: language === 'tr' ? tr : undefined })}
              </motion.h2>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 mt-5">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-foreground shadow-lg'
                      : 'bg-white/20 text-white/90 hover:bg-white/30'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-background">
            <AnimatePresence mode="wait">
              {activeTab === 'flow' && (
                <motion.div
                  key="flow"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                      <span className="text-lg">🩸</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {language === 'tr' ? 'Akış Şiddeti' : 'Flow Intensity'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'tr' ? 'Bugünkü durumunu seç' : 'Select your current flow'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {flowLevels.map((level) => {
                      const labels = FLOW_LABELS[level];
                      const isSelected = flowLevel === level;
                      return (
                        <motion.button
                          key={level}
                          onClick={() => setFlowLevel(level)}
                          className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-500/30'
                              : 'bg-card border border-border hover:border-rose-300'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-2xl mb-1">{labels.emoji}</span>
                          <span className={`text-[10px] text-center font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                            {language === 'tr' ? labels.tr : labels.en}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'symptoms' && (
                <motion.div
                  key="symptoms"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                      <span className="text-lg">💊</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {language === 'tr' ? 'Semptomlar' : 'Symptoms'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'tr' ? 'Yaşadığın belirtileri seç' : 'Select symptoms you experienced'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {symptoms.map((symptom) => {
                      const labels = SYMPTOM_LABELS[symptom];
                      const isSelected = selectedSymptoms.includes(symptom);
                      return (
                        <motion.button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-violet-500/30'
                              : 'bg-card border border-border hover:border-violet-300'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-xl mb-1">{labels.emoji}</span>
                          <span className={`text-[10px] text-center font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                            {language === 'tr' ? labels.tr : labels.en}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'mood' && (
                <motion.div
                  key="mood"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                        <span className="text-lg">😊</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {language === 'tr' ? 'Ruh Hali' : 'Mood'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'tr' ? 'Bugün nasıl hissediyorsun?' : 'How are you feeling?'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {moods.map((mood) => {
                        const labels = MOOD_LABELS[mood];
                        const isSelected = selectedMood === mood;
                        return (
                          <motion.button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                              isSelected
                                ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-500/30'
                                : 'bg-card border border-border hover:border-amber-300'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="text-2xl mb-1">{labels.emoji}</span>
                            <span className={`text-[10px] text-center font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                              {language === 'tr' ? labels.tr : labels.en}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-sm">📝</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {language === 'tr' ? 'Notlar' : 'Notes'}
                      </p>
                    </div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'tr' ? 'Bugün hakkında bir şeyler yaz...' : 'Write something about today...'}
                      className="rounded-2xl resize-none border-border/50 focus:border-primary min-h-[100px]"
                      rows={4}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-card/80 backdrop-blur-sm safe-area-bottom">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                size="lg"
                className={`w-full rounded-2xl h-14 text-white font-semibold shadow-lg bg-gradient-to-r ${tabs.find(t => t.id === activeTab)?.gradient}`}
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