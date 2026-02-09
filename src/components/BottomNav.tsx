// 🌸 Bottom Navigation Component - Ruh Halim Style Animated Icons
import { useCallback, forwardRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

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

export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(function BottomNav({ onCenterPress }, ref) {
  const location = useLocation();
  const navigate = useNavigate();

  // Single swipe navigation instance for the entire app
  useSwipeNavigation({ threshold: 60 });

  const handleTap = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleCenterPress = useCallback(() => {
    onCenterPress?.();
  }, [onCenterPress]);

  const leftTabs = tabConfig.slice(0, 2);
  const rightTabs = tabConfig.slice(2);

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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

        {/* Center FAB Button - Simple click opens UpdateSheet */}
        <div className="relative -mt-8 mx-2">
          <button
            onClick={handleCenterPress}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary via-period to-primary flex items-center justify-center active:scale-90 transition-transform duration-150"
            style={{
              boxShadow: '0 4px 20px -2px hsl(var(--primary) / 0.5), 0 0 30px -5px hsl(var(--primary) / 0.3)',
            }}
          >
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
          </button>
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

// Home Icon - Active: Animated flower/lotus, Inactive: Simple flower outline
function HomeIcon({ isActive }: { isActive: boolean }) {
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
          <svg className="relative w-7 h-7 drop-shadow-lg" viewBox="0 0 24 24" fill="none">
            {/* Lotus/flower petals */}
            <motion.path
              d="M12 3C12 3 8 7 8 11C8 15 12 17 12 17C12 17 16 15 16 11C16 7 12 3 12 3Z"
              fill="hsl(var(--primary))"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            />
            <motion.path
              d="M6 8C6 8 4 12 5 15C6 18 10 19 10 19C10 19 8 15 8 12C8 9 6 8 6 8Z"
              fill="hsl(var(--primary) / 0.7)"
              initial={{ scale: 0, x: 5 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            />
            <motion.path
              d="M18 8C18 8 20 12 19 15C18 18 14 19 14 19C14 19 16 15 16 12C16 9 18 8 18 8Z"
              fill="hsl(var(--primary) / 0.7)"
              initial={{ scale: 0, x: -5 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            />
            {/* Center */}
            <motion.circle
              cx="12"
              cy="12"
              r="2"
              fill="hsl(var(--primary-foreground))"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            />
          </svg>
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
    <div className="relative w-6 h-6 flex items-center justify-center opacity-60">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4C12 4 8 8 8 11.5C8 15 12 17 12 17C12 17 16 15 16 11.5C16 8 12 4 12 4Z" />
        <path d="M6 9C6 9 4 12 5 15C6 18 10 19 10 19" strokeLinecap="round" />
        <path d="M18 9C18 9 20 12 19 15C18 18 14 19 14 19" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Calendar Icon - Active: Animated calendar with date, Inactive: Simple outline
function CalendarIcon({ isActive }: { isActive: boolean }) {
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
}

// Stats/Chart Icon - Active: Animated bars with trend line, Inactive: Static bars
function StatsIcon({ isActive }: { isActive: boolean }) {
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
}

// Medications/Pill Icon - Active: Animated open book style, Inactive: Closed pill
function MedicationsIcon({ isActive }: { isActive: boolean }) {
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
            className="w-1/2 h-full rounded-r-full bg-gradient-to-bl from-period-light to-period-light/80 border-2 border-primary/50"
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
}

// Tab Item Component
function TabItem({ 
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
}
