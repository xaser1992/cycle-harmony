// 🌸 Global Update Sheet Context
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { UpdateSheet } from '@/components/UpdateSheet';
import { useCycleData } from '@/contexts/CycleDataContext';
import type { DayEntry } from '@/types/cycle';
import { format } from 'date-fns';

interface UpdateSheetContextType {
  openUpdateSheet: (options?: OpenSheetOptions) => void;
  closeUpdateSheet: () => void;
  isOpen: boolean;
}

interface OpenSheetOptions {
  date?: Date;
  initialTab?: 'flow' | 'symptoms' | 'mood';
}

const UpdateSheetContext = createContext<UpdateSheetContextType | null>(null);

export function UpdateSheetProvider({ children }: { children: ReactNode }) {
  const { entries, saveDayEntry, userSettings } = useCycleData();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentTab, setCurrentTab] = useState<'flow' | 'symptoms' | 'mood'>('flow');

  // Close sheet on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const openUpdateSheet = useCallback((options?: OpenSheetOptions) => {
    setCurrentDate(options?.date || new Date());
    setCurrentTab(options?.initialTab || 'flow');
    setIsOpen(true);
  }, []);

  const closeUpdateSheet = useCallback(() => {
    setIsOpen(false);
  }, []);

  const existingEntry = entries.find(
    e => e.date === format(currentDate, 'yyyy-MM-dd')
  );

  const handleSaveEntry = async (entry: DayEntry) => {
    await saveDayEntry(entry);
  };

  return (
    <UpdateSheetContext.Provider value={{ openUpdateSheet, closeUpdateSheet, isOpen }}>
      {children}
      <UpdateSheet
        isOpen={isOpen}
        onClose={closeUpdateSheet}
        onSave={handleSaveEntry}
        existingEntry={existingEntry}
        date={currentDate}
        language={userSettings?.language || 'tr'}
        initialTab={currentTab}
      />
    </UpdateSheetContext.Provider>
  );
}

export function useUpdateSheet() {
  const context = useContext(UpdateSheetContext);
  if (!context) {
    // Return safe defaults during initial mount/HMR - prevents crashes
    console.warn('useUpdateSheet called outside provider, returning safe defaults');
    return {
      openUpdateSheet: () => {},
      closeUpdateSheet: () => {},
      isOpen: false,
    };
  }
  return context;
}
