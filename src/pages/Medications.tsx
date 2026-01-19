// 💊 Medication Tracking Page - Flo Inspired Design
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Clock, Trash2, Edit2, ChevronRight, TrendingUp } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { BottomNav } from '@/components/BottomNav';
import { useUpdateSheet } from '@/contexts/UpdateSheetContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { App } from '@capacitor/app';
import { scheduleMedicationNotifications } from '@/lib/medicationNotifications';
import {
  getMedications,
  saveMedication,
  deleteMedication,
  getMedicationLogsForDate,
  toggleMedicationLog,
  getMedicationStats,
} from '@/lib/medicationStorage';
import {
  Medication,
  MedicationLog,
  MedicationCategory,
  MedicationFrequency,
  MEDICATION_CATEGORY_LABELS,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_COLORS,
  MEDICATION_ICONS,
} from '@/types/medication';

export default function Medications() {
  const { openUpdateSheet } = useUpdateSheet();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [medicationStats, setMedicationStats] = useState<Record<string, number>>({});
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Swipe navigation - tab arası geçiş için
  useSwipeNavigation({ threshold: 60 });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as MedicationCategory,
    dosage: '',
    frequency: 'daily' as MedicationFrequency,
    reminderTimes: ['09:00'],
    notes: '',
    color: MEDICATION_COLORS[0],
    icon: MEDICATION_ICONS[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  // Handle Android back button for sheets
  useEffect(() => {
    const hasOpenSheet = isAddSheetOpen || !!selectedMedication;
    if (!hasOpenSheet) return;
    
    const backHandler = App.addListener('backButton', () => {
      if (isAddSheetOpen) {
        setIsAddSheetOpen(false);
      } else if (selectedMedication) {
        setSelectedMedication(null);
      }
    });
    
    return () => {
      backHandler.then(handler => handler.remove());
    };
  }, [isAddSheetOpen, selectedMedication]);
  const loadData = async () => {
    const [meds, logs] = await Promise.all([
      getMedications(),
      getMedicationLogsForDate(today),
    ]);
    setMedications(meds.filter(m => m.isActive));
    setTodayLogs(logs);

    // Load stats for each medication
    const statsPromises = meds.map(async (med) => {
      const stats = await getMedicationStats(med.id, 7);
      return { id: med.id, rate: stats.adherenceRate };
    });
    const statsResults = await Promise.all(statsPromises);
    const statsMap: Record<string, number> = {};
    statsResults.forEach(s => { statsMap[s.id] = s.rate; });
    setMedicationStats(statsMap);
  };

  const handleToggleMedication = async (medication: Medication, time: string, currentlyTaken: boolean) => {
    await toggleMedicationLog(medication.id, today, time, !currentlyTaken);
    await loadData();
    toast.success(!currentlyTaken ? '✓ İlaç alındı' : 'İlaç durumu güncellendi');
  };

  const isMedicationTakenAtTime = (medicationId: string, time: string) => {
    const log = todayLogs.find(
      l => l.medicationId === medicationId && l.time === time
    );
    return log?.taken ?? false;
  };

  const getTodayProgress = () => {
    if (medications.length === 0) return 0;
    const totalDoses = medications.reduce((sum, med) => sum + med.reminderTimes.length, 0);
    const takenDoses = todayLogs.filter(log => log.taken).length;
    return totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
  };

  const handleSaveMedication = async () => {
    if (!formData.name.trim()) {
      toast.error('İlaç adı gerekli');
      return;
    }

    const medication: Medication = {
      id: editingMedication?.id || `med_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      dosage: formData.dosage,
      frequency: formData.frequency,
      reminderTimes: formData.reminderTimes,
      notes: formData.notes,
      color: formData.color,
      icon: formData.icon,
      isActive: true,
      createdAt: editingMedication?.createdAt || new Date().toISOString(),
    };

    await saveMedication(medication);
    
    // Schedule notifications for all active medications
    const allMeds = await getMedications();
    await scheduleMedicationNotifications(allMeds.filter(m => m.isActive));
    
    await loadData();
    setIsAddSheetOpen(false);
    setEditingMedication(null);
    resetForm();
    toast.success(editingMedication ? 'İlaç güncellendi' : 'İlaç eklendi');
  };

  const handleDeleteMedication = async (id: string) => {
    await deleteMedication(id);
    await loadData();
    setSelectedMedication(null);
    toast.success('İlaç silindi');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
      dosage: '',
      frequency: 'daily',
      reminderTimes: ['09:00'],
      notes: '',
      color: MEDICATION_COLORS[0],
      icon: MEDICATION_ICONS[0],
    });
  };

  const openEditSheet = (medication: Medication) => {
    setFormData({
      name: medication.name,
      category: medication.category,
      dosage: medication.dosage,
      frequency: medication.frequency,
      reminderTimes: medication.reminderTimes,
      notes: medication.notes || '',
      color: medication.color,
      icon: medication.icon,
    });
    setEditingMedication(medication);
    setIsAddSheetOpen(true);
  };

  const addReminderTime = () => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '12:00'],
    }));
  };

  const removeReminderTime = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== index),
    }));
  };

  const updateReminderTime = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.map((t, i) => i === index ? value : t),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
      {/* Header */}
      <motion.div 
        className="px-5 pt-16 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">İlaç Takibi</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), 'd MMMM yyyy, EEEE', { locale: tr })}
        </p>
      </motion.div>

      {/* Today's Progress */}
      <motion.div 
        className="px-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 border-violet-200/30 dark:border-violet-800/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Bugünkü İlerleme</span>
              <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                {Math.round(getTodayProgress())}%
              </span>
            </div>
            <Progress value={getTodayProgress()} className="h-2.5 bg-violet-100 dark:bg-violet-900/30" />
            <p className="text-xs text-muted-foreground mt-2">
              {todayLogs.filter(l => l.taken).length} / {medications.reduce((sum, med) => sum + med.reminderTimes.length, 0)} doz alındı
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Medications List */}
      <div className="px-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">İlaçlarım</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm();
              setEditingMedication(null);
              setIsAddSheetOpen(true);
            }}
            className="text-violet-600 dark:text-violet-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ekle
          </Button>
        </div>

        {medications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <span className="text-4xl">💊</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Henüz ilaç eklenmedi</h3>
            <p className="text-sm text-muted-foreground mb-4">
              İlaçlarınızı ekleyerek takip etmeye başlayın
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsAddSheetOpen(true);
              }}
              className="bg-gradient-to-r from-violet-500 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              İlaç Ekle
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {medications.map((medication, index) => (
              <motion.div
                key={medication.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="overflow-hidden border-l-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: medication.color }}
                  onClick={() => setSelectedMedication(medication)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${medication.color}20` }}
                        >
                          {medication.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{medication.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {medication.dosage} • {MEDICATION_FREQUENCY_LABELS[medication.frequency].tr}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Dose times for today */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {medication.reminderTimes.map((time) => {
                        const taken = isMedicationTakenAtTime(medication.id, time);
                        return (
                          <motion.button
                            key={time}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMedication(medication, time, taken);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                              taken
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            {taken ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {time}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Weekly adherence */}
                    {medicationStats[medication.id] !== undefined && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Haftalık uyum: {Math.round(medicationStats[medication.id])}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Medication Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={() => {}}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-3xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Custom Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsAddSheetOpen(false);
            }}
            className="absolute right-4 top-4 z-50 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-90 transition-all"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingMedication ? 'İlaç Düzenle' : 'Yeni İlaç Ekle'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 overflow-y-auto h-[calc(100%-120px)] pb-4 px-1">
            {/* Name */}
            <div>
              <Label htmlFor="name">İlaç Adı</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="örn: Doğum kontrol hapı"
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div>
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value: MedicationCategory) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDICATION_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label.emoji} {label.tr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dosage */}
            <div>
              <Label htmlFor="dosage">Dozaj</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="örn: 1 tablet, 500mg"
                className="mt-1"
              />
            </div>

            {/* Frequency */}
            <div>
              <Label>Sıklık</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: MedicationFrequency) => 
                  setFormData(prev => ({ ...prev, frequency: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDICATION_FREQUENCY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label.tr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reminder Times */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Hatırlatma Saatleri</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addReminderTime}
                  className="text-violet-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ekle
                </Button>
              </div>
              <div className="space-y-2">
                {formData.reminderTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateReminderTime(index, e.target.value)}
                      className="flex-1"
                    />
                    {formData.reminderTimes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReminderTime(index)}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notlar (opsiyonel)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ek notlar..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button
              onClick={handleSaveMedication}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {editingMedication ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Medication Detail Sheet */}
      <Sheet open={!!selectedMedication} onOpenChange={() => {}}>
        <SheetContent 
          side="bottom" 
          className="h-[60vh] rounded-t-3xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {selectedMedication && (
            <>
              {/* Custom Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedMedication(null);
                }}
                className="absolute right-4 top-4 z-50 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 active:scale-90 transition-all"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${selectedMedication.color}20` }}
                  >
                    {selectedMedication.icon}
                  </div>
                  <div>
                    <SheetTitle>{selectedMedication.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedMedication.dosage} • {MEDICATION_FREQUENCY_LABELS[selectedMedication.frequency].tr}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Kategori</span>
                      <span className="font-medium">
                        {MEDICATION_CATEGORY_LABELS[selectedMedication.category].emoji}{' '}
                        {MEDICATION_CATEGORY_LABELS[selectedMedication.category].tr}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedMedication.notes && (
                  <Card>
                    <CardContent className="p-4">
                      <span className="text-sm text-muted-foreground block mb-1">Notlar</span>
                      <p className="text-foreground">{selectedMedication.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {medicationStats[selectedMedication.id] !== undefined && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Haftalık Uyum</span>
                        <span className="font-bold text-violet-600">
                          {Math.round(medicationStats[selectedMedication.id])}%
                        </span>
                      </div>
                      <Progress value={medicationStats[selectedMedication.id]} className="h-2" />
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedMedication(null);
                      openEditSheet(selectedMedication);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDeleteMedication(selectedMedication.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav onCenterPress={(tab) => openUpdateSheet({ initialTab: tab })} />
    </div>
  );
}
