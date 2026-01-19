// 🌸 Quick Actions Component
import { motion } from 'framer-motion';
import { Droplets, Moon, PenLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onLogPeriod: () => void;
  onLogSymptoms: () => void;
  onOpenUpdate: () => void;
  language?: 'tr' | 'en';
  isOnPeriod?: boolean;
}

export function QuickActions({ 
  onLogPeriod, 
  onLogSymptoms, 
  onOpenUpdate,
  language = 'tr',
  isOnPeriod = false
}: QuickActionsProps) {
  const actions = [
    {
      icon: Droplets,
      label: language === 'tr' 
        ? (isOnPeriod ? 'Regl Bitti' : 'Regl Başladı')
        : (isOnPeriod ? 'Period Ended' : 'Period Started'),
      color: 'bg-period-light text-period hover:bg-period/20',
      onClick: onLogPeriod,
    },
    {
      icon: PenLine,
      label: language === 'tr' ? 'Semptom Ekle' : 'Add Symptom',
      color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      onClick: onLogSymptoms,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Update Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onOpenUpdate}
          size="lg"
          className="w-full h-14 rounded-2xl period-gradient text-white shadow-lg shadow-primary/20 text-lg font-semibold"
        >
          <Plus className="w-5 h-5 mr-2" />
          {language === 'tr' ? 'Bugünü Güncelle' : 'Update Today'}
        </Button>
      </motion.div>

      {/* Quick Action Buttons */}
      <div className="flex gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            className="flex-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="ghost"
              onClick={action.onClick}
              className={`w-full h-12 rounded-xl ${action.color} flex items-center justify-center gap-2`}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
