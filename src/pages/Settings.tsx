// 🌸 Settings Page - Placeholder
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Ayarlar</h1>
      </header>
      
      <main className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <span className="text-6xl mb-4">⚙️</span>
          <p className="text-muted-foreground">Ayarlar sayfası yakında eklenecek</p>
        </motion.div>
      </main>
      
      <BottomNav />
    </div>
  );
}
