// 🌸 Update Bottom Sheet Component
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import type { DayEntry, FlowLevel, Symptom, Mood } from '@/types/cycle';
import { FLOW_LABELS, SYMPTOM_LABELS, MOOD_LABELS } from '@/types/cycle';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

  // Reset form when opening with existing entry
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
    { id: 'flow', label: language === 'tr' ? 'Akış' : 'Flow', icon: '🩸' },
    { id: 'symptoms', label: language === 'tr' ? 'Semptomlar' : 'Symptoms', icon: '💊' },
    { id: 'mood', label: language === 'tr' ? 'Ruh Hali' : 'Mood', icon: '😊' },
  ] as const;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">
                {format(date, 'd MMMM yyyy', { locale: language === 'tr' ? tr : undefined })}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <AnimatePresence mode="wait">
              {activeTab === 'flow' && (
                <motion.div
                  key="flow"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'tr' ? 'Akış şiddetini seç' : 'Select flow intensity'}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {flowLevels.map((level) => {
                      const labels = FLOW_LABELS[level];
                      return (
                        <button
                          key={level}
                          onClick={() => setFlowLevel(level)}
                          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                            flowLevel === level
                              ? 'bg-period-light ring-2 ring-period'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span className="text-2xl mb-1">{labels.emoji}</span>
                          <span className="text-xs text-center">
                            {language === 'tr' ? labels.tr : labels.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'symptoms' && (
                <motion.div
                  key="symptoms"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'tr' ? 'Bugün yaşadığın semptomları seç' : 'Select symptoms you experienced today'}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {symptoms.map((symptom) => {
                      const labels = SYMPTOM_LABELS[symptom];
                      const isSelected = selectedSymptoms.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-primary/10 ring-2 ring-primary'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span className="text-xl mb-1">{labels.emoji}</span>
                          <span className="text-xs text-center">
                            {language === 'tr' ? labels.tr : labels.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === 'mood' && (
                <motion.div
                  key="mood"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === 'tr' ? 'Bugün nasıl hissediyorsun?' : 'How are you feeling today?'}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {moods.map((mood) => {
                        const labels = MOOD_LABELS[mood];
                        return (
                          <button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                              selectedMood === mood
                                ? 'bg-accent/20 ring-2 ring-accent'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            <span className="text-2xl mb-1">{labels.emoji}</span>
                            <span className="text-xs text-center">
                              {language === 'tr' ? labels.tr : labels.en}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {language === 'tr' ? 'Notlar (opsiyonel)' : 'Notes (optional)'}
                    </p>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={language === 'tr' ? 'Bugün hakkında not ekle...' : 'Add a note about today...'}
                      className="rounded-xl resize-none"
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-background">
            <Button
              onClick={handleSave}
              size="lg"
              className="w-full rounded-2xl period-gradient text-white"
            >
              <Check className="w-5 h-5 mr-2" />
              {language === 'tr' ? 'Kaydet' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
