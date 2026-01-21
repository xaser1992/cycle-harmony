// 🌸 Translations for the app
export type Language = 'tr' | 'en';

export const UI_TRANSLATIONS = {
  // Common
  save: { tr: 'Kaydet', en: 'Save' },
  cancel: { tr: 'İptal', en: 'Cancel' },
  close: { tr: 'Kapat', en: 'Close' },
  edit: { tr: 'Düzenle', en: 'Edit' },
  delete: { tr: 'Sil', en: 'Delete' },
  add: { tr: 'Ekle', en: 'Add' },
  back: { tr: 'Geri', en: 'Back' },
  next: { tr: 'İleri', en: 'Next' },
  skip: { tr: 'Atla', en: 'Skip' },
  done: { tr: 'Bitti', en: 'Done' },
  today: { tr: 'Bugün', en: 'Today' },
  day: { tr: 'gün', en: 'day' },
  days: { tr: 'gün', en: 'days' },

  // Navigation
  home: { tr: 'Ana Sayfa', en: 'Home' },
  calendar: { tr: 'Takvim', en: 'Calendar' },
  stats: { tr: 'İstatistikler', en: 'Statistics' },
  medications: { tr: 'İlaçlar', en: 'Medications' },
  settings: { tr: 'Ayarlar', en: 'Settings' },
  profile: { tr: 'Profil', en: 'Profile' },

  // Cycle phases
  period: { tr: 'Regl', en: 'Period' },
  follicular: { tr: 'Foliküler', en: 'Follicular' },
  ovulation: { tr: 'Yumurtlama', en: 'Ovulation' },
  fertile: { tr: 'Doğurgan', en: 'Fertile' },
  luteal: { tr: 'Luteal', en: 'Luteal' },
  pms: { tr: 'PMS', en: 'PMS' },

  // Predictions
  nextPeriod: { tr: 'Sonraki Regl', en: 'Next Period' },
  ovulationDay: { tr: 'Yumurtlama Günü', en: 'Ovulation Day' },
  fertileWindow: { tr: 'Doğurgan Dönem', en: 'Fertile Window' },
  upcomingDates: { tr: 'Yaklaşan Tarihler', en: 'Upcoming Dates' },

  // Settings
  language: { tr: 'Dil', en: 'Language' },
  theme: { tr: 'Tema', en: 'Theme' },
  themeLight: { tr: 'Açık', en: 'Light' },
  themeDark: { tr: 'Koyu', en: 'Dark' },
  themeSystem: { tr: 'Sistem', en: 'System' },
  cycleSettings: { tr: 'Döngü Ayarları', en: 'Cycle Settings' },
  cycleLength: { tr: 'Döngü Uzunluğu', en: 'Cycle Length' },
  periodLength: { tr: 'Regl Süresi', en: 'Period Length' },
  notifications: { tr: 'Bildirimler', en: 'Notifications' },
  privacy: { tr: 'Gizlilik', en: 'Privacy' },
  appLock: { tr: 'Uygulama Kilidi', en: 'App Lock' },
  exportData: { tr: 'Verileri Dışa Aktar', en: 'Export Data' },
  deleteAllData: { tr: 'Tüm Verileri Sil', en: 'Delete All Data' },
  appearance: { tr: 'Görünüm', en: 'Appearance' },
  wellnessGoals: { tr: 'Wellness Hedefleri', en: 'Wellness Goals' },
  targetWeight: { tr: 'Hedef Ağırlık', en: 'Target Weight' },
  dailyWaterGoal: { tr: 'Günlük Su Hedefi', en: 'Daily Water Goal' },
  waterReminder: { tr: 'Su Hatırlatıcısı', en: 'Water Reminder' },
  glasses: { tr: 'bardak', en: 'glasses' },

  // Period tracking
  periodStarted: { tr: 'Regl Başladı', en: 'Period Started' },
  periodEnded: { tr: 'Regl Bitti', en: 'Period Ended' },
  flow: { tr: 'Akış', en: 'Flow' },
  symptoms: { tr: 'Belirtiler', en: 'Symptoms' },
  mood: { tr: 'Ruh Hali', en: 'Mood' },
  notes: { tr: 'Notlar', en: 'Notes' },
  
  // UpdateSheet categories
  periodFlow: { tr: 'Adet akışı', en: 'Period flow' },
  moodCategory: { tr: 'Ruh hali', en: 'Mood' },
  sexDrive: { tr: 'Cinsel ilişki ve cinsel ilişki isteği', en: 'Sex & sex drive' },
  symptomsCategory: { tr: 'Belirtiler', en: 'Symptoms' },
  vaginalDischarge: { tr: 'Vajinal akıntı', en: 'Vaginal discharge' },
  digestion: { tr: 'Sindirim ve dışkı', en: 'Digestion' },
  pregnancyTest: { tr: 'Gebelik testi', en: 'Pregnancy test' },
  ovulationTest: { tr: 'Ovülasyon testi', en: 'Ovulation test' },
  physicalActivity: { tr: 'Fiziksel aktivite', en: 'Physical activity' },
  other: { tr: 'Diğer', en: 'Other' },
  water: { tr: 'Su', en: 'Water' },
  weight: { tr: 'Ağırlık', en: 'Weight' },
  clear: { tr: 'Temizle', en: 'Clear' },
  increment: { tr: '0.1 kg artış/azalış', en: '0.1 kg increment' },
  writeSomething: { tr: 'Bugün hakkında bir şeyler yaz...', en: 'Write something about today...' },

  // Calendar
  weekdays: { 
    tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  noRecords: { tr: 'Bu gün için kayıt yok', en: 'No records for this day' },
  addRecord: { tr: 'Kayıt Ekle', en: 'Add Record' },
  viewDay: { tr: 'Günü Görüntüle', en: 'View Day' },
  showInCalendar: { tr: 'Takvimde Göster', en: 'Show in Calendar' },

  // Day types
  periodDay: { tr: 'Regl Günü', en: 'Period Day' },
  predictedPeriod: { tr: 'Tahmini Regl', en: 'Predicted Period' },
  fertileDay: { tr: 'Doğurgan Dönem', en: 'Fertile Window' },
  ovulationDayLabel: { tr: 'Yumurtlama Günü', en: 'Ovulation Day' },
  pmsPeriod: { tr: 'PMS Dönemi', en: 'PMS Period' },
  normalDay: { tr: 'Normal Gün', en: 'Normal Day' },

  // Info modals
  whatToExpect: { tr: 'Ne Beklemeli?', en: 'What to Expect?' },
  tips: { tr: 'İpuçları', en: 'Tips' },
  whatIsOvulation: { tr: 'Yumurtlama Nedir?', en: 'What is Ovulation?' },
  dailyPregnancyChance: { tr: 'Günlük Hamilelik Şansı', en: 'Daily Pregnancy Chance' },
  importantInfo: { tr: 'Önemli Bilgiler', en: 'Important Info' },
  reminderSet: { tr: 'Hatırlatıcı kuruldu!', en: 'Reminder set!' },
  notificationPermissionRequired: { tr: 'Bildirim izni gerekli', en: 'Notification permission required' },

  // Medications
  todaysMedications: { tr: 'Bugünün İlaçları', en: "Today's Medications" },
  dosesTaken: { tr: 'doz alındı', en: 'doses taken' },
  medicationStatus: { tr: 'İlaç Durumu', en: 'Medication Status' },

  // Tests
  testNotTaken: { tr: 'Test yapmadım', en: 'Did not take test' },
  testPositive: { tr: 'Pozitif', en: 'Positive' },
  testNegative: { tr: 'Negatif', en: 'Negative' },
  faintLine: { tr: 'Soluk çizgi', en: 'Faint line' },
  ownMethod: { tr: 'Kendi yöntemim', en: 'My own method' },

  // About
  version: { tr: 'Versiyon', en: 'Version' },
  medicalDisclaimer: { 
    tr: 'Bu uygulama tıbbi bir cihaz değildir. Sağlık kararlarınız için lütfen bir sağlık uzmanına danışın.',
    en: 'This app is not a medical device. Please consult a healthcare professional for your health decisions.'
  },
} as const;

// Helper function to get translation
export function t(key: keyof typeof UI_TRANSLATIONS, language: Language): string | readonly string[] {
  const translation = UI_TRANSLATIONS[key];
  if (typeof translation === 'object' && 'tr' in translation) {
    return translation[language];
  }
  return key;
}
