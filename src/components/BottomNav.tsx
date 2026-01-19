// 🌸 Bottom Navigation Component - Ruh Halim Style Animated Icons
import { useState, useRef, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  icon: string;
  label: string;
  labelEn: string;
  gradient: string;
  tab: 'flow' | 'symptoms' | 'mood';
}

const quickActions: QuickAction[] = [
  { icon: '🩸', label: 'Akış', labelEn: 'Flow', gradient: 'from-rose-400 to-pink-500', tab: 'flow' },
  { icon: '💊', label: 'Semptom', labelEn: 'Symptoms', gradient: 'from-violet-400 to-purple-500', tab: 'symptoms' },
  { icon: '😊', label: 'Ruh Hali', labelEn: 'Mood', gradient: 'from-amber-400 to-orange-400', tab: 'mood' },
];

// Tab configuration
interface TabConfig {
  id: 'home' | 'calendar' | 'stats' | 'medications';
  label: string;
  labelEn: string;
  path: string;
}

const tabConfig: TabConfig[] = [
  { id: 'home', label: 'Bugün', labelEn: 'Today', path: '/' },
  { id: 'calendar', label: 'Takvim', labelEn: 'Calendar', path: '/calendar' },
  { id: 'stats', label: 'İstatistik', labelEn: 'Stats', path: '/stats' },
  { id: 'medications', label: 'İlaçlar', labelEn: 'Meds', path: '/medications' },
];

// Spring animation config
const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

interface BottomNavProps {
  onCenterPress?: (tab?: 'flow' | 'symptoms' | 'mood') => void;
}

export const BottomNav = memo(function BottomNav({ onCenterPress }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTap = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleCenterPress = useCallback(() => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    onCenterPress?.();
  }, [onCenterPress]);

  const handleLongPressStart = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowQuickActions(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleQuickAction = useCallback((tab: 'flow' | 'symptoms' | 'mood') => {
    setShowQuickActions(false);
    onCenterPress?.(tab);
  }, [onCenterPress]);

  const leftTabs = tabConfig.slice(0, 2);
  const rightTabs = tabConfig.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-border/30" />
      
      <div className="relative flex items-center justify-around h-[68px] px-1">
        {/* Left tabs */}
        <div className="flex items-center justify-center flex-1 gap-0">
          {leftTabs.map((tab) => (
            <TabItem
              key={tab.path}
              tab={tab}
              isActive={location.pathname === tab.path}
              onTap={handleTap}
            />
          ))}
        </div>
        
        {/* Center FAB Button */}
        <div className="relative -mt-8 mx-2">
          {/* Quick Actions Popup */}
          <AnimatePresence>
            {showQuickActions && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                  onClick={() => setShowQuickActions(false)}
                />
                
                {quickActions.map((action, index) => {
                  const positions = [
                    { x: -65, y: -75 },
                    { x: 0, y: -95 },
                    { x: 65, y: -75 },
                  ];
                  const pos = positions[index];
                  
                  return (
                    <motion.button
                      key={action.tab}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        x: pos.x, 
                        y: pos.y,
                      }}
                      exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      transition={{ ...springConfig, delay: index * 0.05 }}
                      onClick={() => handleQuickAction(action.tab)}
                      className={`absolute z-50 flex flex-col items-center gap-1 p-3 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-xl`}
                      style={{ 
                        left: '50%',
                        top: '50%',
                        marginLeft: '-24px',
                        marginTop: '-24px',
                      }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-[10px] font-medium text-white whitespace-nowrap">{action.label}</span>
                    </motion.button>
                  );
                })}
              </>
            )}
          </AnimatePresence>

          {/* FAB Button */}
          <motion.button
            onClick={handleCenterPress}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 flex items-center justify-center"
            style={{
              boxShadow: '0 4px 20px -2px hsl(var(--primary) / 0.5), 0 0 30px -5px hsl(var(--primary) / 0.3)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            animate={{ rotate: showQuickActions ? 45 : 0 }}
            transition={springConfig}
          >
            {/* Ripple effect ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={showQuickActions ? { scale: [1, 1.3], opacity: [0.5, 0] } : {}}
              transition={{ duration: 0.6, repeat: showQuickActions ? Infinity : 0 }}
            />
            
            <svg
              className="w-7 h-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </motion.button>
        </div>
        
        {/* Right tabs */}
        <div className="flex items-center justify-center flex-1 gap-0">
          {rightTabs.map((tab) => (
            <TabItem
              key={tab.path}
              tab={tab}
              isActive={location.pathname === tab.path}
              onTap={handleTap}
            />
          ))}
        </div>
      </div>
    </nav>
  );
});

// ============================================
// Animated Tab Icons (Ruh Halim Style)
// ============================================

// Home Icon - Active: House with glow, Inactive: Simple outline
const HomeIcon = memo(function HomeIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative w-8 h-8 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full blur-md opacity-60 bg-primary" />
          <span className="relative text-2xl drop-shadow-lg">🏠</span>
        </motion.div>
        {/* Floating sparkles */}
        {['✨', '💫'].map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ 
              scale: [0, 0.8, 0.6],
              opacity: [0, 1, 0],
              y: [0, -10, -15],
            }}
            transition={{
              duration: 0.8,
              delay: 0.2 + i * 0.15,
              ease: "easeOut",
            }}
            className="absolute text-xs pointer-events-none"
            style={{
              left: i === 0 ? '-2px' : 'auto',
              right: i === 1 ? '-2px' : 'auto',
              top: '0px',
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
    );
  }
  
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <span className="text-xl opacity-60 grayscale-[30%]">🏠</span>
    </div>
  );
});

// Calendar Icon - Active: Animated calendar with date, Inactive: Simple outline
const CalendarIcon = memo(function CalendarIcon({ isActive }: { isActive: boolean }) {
  const todayDate = new Date().getDate();
  
  if (isActive) {
    return (
      <div className="relative w-7 h-8 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, y: 5 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative w-full h-full flex flex-col overflow-hidden rounded-sm border-2 border-primary bg-card shadow-lg"
        >
          {/* Calendar header with rings */}
          <div className="relative w-full h-2.5 bg-primary">
            {/* Calendar rings */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="absolute -top-1 left-1.5 w-1 h-2 rounded-full bg-primary-foreground/80"
            />
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="absolute -top-1 right-1.5 w-1 h-2 rounded-full bg-primary-foreground/80"
            />
          </div>
          {/* Calendar body */}
          <div className="w-full flex-1 flex items-center justify-center bg-background">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="text-sm font-bold text-primary"
            >
              {todayDate}
            </motion.span>
          </div>
        </motion.div>
        {/* Notification dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive shadow-sm"
        />
      </div>
    );
  }
  
  return (
    <div className="relative w-6 h-7 flex flex-col items-center">
      <div className="relative w-full h-full flex flex-col overflow-hidden rounded-sm border-2 border-muted-foreground/40 bg-muted/20">
        <div className="w-full h-2 bg-muted-foreground/40" />
        <div className="w-full flex-1 flex items-center justify-center">
          <div className="flex flex-col gap-0.5">
            <div className="w-3 h-0.5 rounded-full bg-muted-foreground/30" />
            <div className="w-3 h-0.5 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Stats/Chart Icon - Active: Animated bars with trend line, Inactive: Static bars
const StatsIcon = memo(function StatsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative w-8 h-6 flex items-end justify-center gap-0.5 pb-0.5">
        {[0.4, 0.7, 0.5, 0.9].map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 200, damping: 15 }}
            className={`w-1.5 rounded-t-sm ${
              i % 2 === 0 
                ? 'bg-gradient-to-t from-primary to-primary/70' 
                : 'bg-gradient-to-t from-pink-500 to-pink-400'
            } shadow-sm`}
          />
        ))}
        {/* Trend line */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }} 
          className="absolute inset-0 pointer-events-none"
        >
          <svg className="w-full h-full" viewBox="0 0 32 24" fill="none">
            <motion.path 
              d="M 4 18 Q 10 14, 16 10 T 28 4" 
              stroke="hsl(var(--primary))" 
              strokeWidth="2" 
              strokeLinecap="round" 
              fill="none" 
              initial={{ pathLength: 0 }} 
              animate={{ pathLength: 1 }} 
              transition={{ delay: 0.6, duration: 0.6 }} 
            />
          </svg>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="relative w-7 h-5 flex items-end justify-center gap-0.5 pb-0.5">
      {[0.3, 0.6, 0.4, 0.8].map((height, i) => (
        <div 
          key={i} 
          className="w-1 rounded-t-sm bg-muted-foreground/40" 
          style={{ height: `${height * 100}%` }} 
        />
      ))}
    </div>
  );
});

// Medications/Pill Icon - Active: Animated open book style, Inactive: Closed pill
const MedicationsIcon = memo(function MedicationsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative w-9 h-7 flex items-center justify-center">
        {/* Open pill capsule with animation */}
        <div className="relative w-full h-full flex shadow-lg rounded-full">
          {/* Left half */}
          <motion.div 
            initial={{ x: 5, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-1/2 h-full rounded-l-full bg-gradient-to-br from-primary to-primary/80 border-2 border-primary"
          />
          {/* Right half */}
          <motion.div 
            initial={{ x: -5, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="w-1/2 h-full rounded-r-full bg-gradient-to-bl from-pink-200 to-pink-100 border-2 border-primary/50"
          />
          {/* Center glow */}
          <motion.div 
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/60 via-white to-white/60 shadow-lg"
          />
          {/* Heart icon */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-xs">💊</span>
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-6 h-5 flex items-center justify-center">
      <div className="relative w-full h-4 rounded-full bg-gradient-to-r from-muted-foreground/40 to-muted/30 border border-muted-foreground/30">
        <div className="absolute left-0 top-0 bottom-0 w-1/2 rounded-l-full bg-muted-foreground/50" />
      </div>
    </div>
  );
});

// Tab Item Component
const TabItem = memo(function TabItem({ 
  tab, 
  isActive, 
  onTap 
}: { 
  tab: TabConfig; 
  isActive: boolean;
  onTap: (path: string) => void;
}) {
  const renderIcon = () => {
    switch (tab.id) {
      case 'home': return <HomeIcon isActive={isActive} />;
      case 'calendar': return <CalendarIcon isActive={isActive} />;
      case 'stats': return <StatsIcon isActive={isActive} />;
      case 'medications': return <MedicationsIcon isActive={isActive} />;
      default: return null;
    }
  };

  return (
    <motion.button
      onClick={() => onTap(tab.path)}
      className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[72px] rounded-lg transition-colors duration-200 ${
        isActive 
          ? 'text-primary bg-primary/10' 
          : 'text-muted-foreground/50 hover:text-muted-foreground/70'
      }`}
      whileTap={{ scale: 0.92 }}
      transition={springConfig}
    >
      {/* Icon container */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: isActive ? 1 : 0.95,
          y: isActive ? -1 : 0,
        }}
        transition={springConfig}
      >
        {renderIcon()}
      </motion.div>
      
      {/* Label */}
      <motion.span
        className={`text-[10px] font-medium truncate w-full leading-tight transition-all duration-200 mt-0.5 ${
          isActive ? 'opacity-100' : 'opacity-70'
        }`}
        animate={{ opacity: isActive ? 1 : 0.7 }}
        transition={{ duration: 0.2 }}
      >
        {tab.label}
      </motion.span>
    </motion.button>
  );
});
