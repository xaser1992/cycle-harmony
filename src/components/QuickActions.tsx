// 🌸 Quick Actions Component - Flo Inspired Design
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface QuickActionsProps {
  onLogPeriod: () => void;
  onLogSymptoms: () => void;
  onOpenUpdate: () => void;
  language?: 'tr' | 'en';
  isOnPeriod?: boolean;
}

// Custom gradient icons
const DropletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="dropletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <path 
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" 
      fill="url(#dropletGradient)"
      stroke="none"
    />
  </svg>
);

const SymptomIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="symptomGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
    <path 
      d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" 
      fill="url(#symptomGradient)"
    />
    <path d="M14 2v6h6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 13h8M8 17h5" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoodIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="moodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#moodGradient)" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <circle cx="9" cy="9" r="1.5" fill="white" />
    <circle cx="15" cy="9" r="1.5" fill="white" />
  </svg>
);

export function QuickActions({ 
  onLogPeriod, 
  onLogSymptoms, 
  onOpenUpdate,
  language = 'tr',
  isOnPeriod = false
}: QuickActionsProps) {
  const quickActions = [
    {
      icon: DropletIcon,
      label: language === 'tr' 
        ? (isOnPeriod ? 'Regl Bitti' : 'Regl Başladı')
        : (isOnPeriod ? 'Period Ended' : 'Period Started'),
      gradient: 'from-rose-400 to-pink-500',
      shadowColor: 'shadow-rose-500/30',
      onClick: onLogPeriod,
    },
    {
      icon: SymptomIcon,
      label: language === 'tr' ? 'Semptom' : 'Symptom',
      gradient: 'from-violet-400 to-purple-500',
      shadowColor: 'shadow-violet-500/30',
      onClick: onLogSymptoms,
    },
    {
      icon: MoodIcon,
      label: language === 'tr' ? 'Ruh Hali' : 'Mood',
      gradient: 'from-amber-400 to-orange-400',
      shadowColor: 'shadow-amber-500/30',
      onClick: onOpenUpdate,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Main Update Button */}
      <motion.button
        onClick={onOpenUpdate}
        className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-400 via-pink-500 to-rose-500 p-4 shadow-lg shadow-rose-500/25"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated background elements */}
        <motion.div
          className="absolute inset-0"
          initial={false}
        >
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full"
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, -5, 0],
              y: [0, 5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <div className="relative flex items-center justify-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ rotate: 90 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-lg font-bold text-white">
            {language === 'tr' ? 'Bugünü Güncelle' : 'Update Today'}
          </span>
        </div>
      </motion.button>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            onClick={action.onClick}
            className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${action.gradient} shadow-lg ${action.shadowColor}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Icon container */}
            <motion.div 
              className="flex flex-col items-center gap-2"
              whileHover={{ y: -2 }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-white text-center leading-tight">
                {action.label}
              </span>
            </motion.div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}