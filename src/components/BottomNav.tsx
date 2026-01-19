// 🌸 Bottom Navigation Component - Premium Animated Version
import { useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  icon: string;
  label: string;
  gradient: string;
  tab: 'flow' | 'symptoms' | 'mood';
}

const quickActions: QuickAction[] = [
  { icon: '🩸', label: 'Akış', gradient: 'from-rose-400 to-pink-500', tab: 'flow' },
  { icon: '💊', label: 'Semptom', gradient: 'from-violet-400 to-purple-500', tab: 'symptoms' },
  { icon: '😊', label: 'Ruh Hali', gradient: 'from-amber-400 to-orange-400', tab: 'mood' },
];

// Icon components with enhanced active states
const HomeIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CalendarIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="17" rx="2.5" fill={isActive ? "hsl(var(--primary))" : "hsl(var(--muted))"} fillOpacity={isActive ? 0.15 : 0.5} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1.5} />
    <rect x="3" y="5" width="18" height="4" rx="2.5" fill={isActive ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"} fillOpacity={isActive ? 1 : 0.4} />
    <line x1="8" y1="3" x2="8" y2="7" stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={2} strokeLinecap="round" />
    <line x1="16" y1="3" x2="16" y2="7" stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={2} strokeLinecap="round" />
    <text x="12" y="17" textAnchor="middle" fontSize={isActive ? "8" : "7"} fontWeight="bold" fill={isActive ? "hsl(var(--primary))" : "currentColor"}>
      {new Date().getDate()}
    </text>
  </svg>
);

const ChartIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="14" width="4" height="7" rx="1" fill={isActive ? "hsl(var(--primary))" : "currentColor"} fillOpacity={isActive ? 0.5 : 0.3} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1} />
    <rect x="10" y="10" width="4" height="11" rx="1" fill={isActive ? "hsl(var(--primary))" : "currentColor"} fillOpacity={isActive ? 0.7 : 0.5} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1} />
    <rect x="16" y="5" width="4" height="16" rx="1" fill={isActive ? "hsl(var(--primary))" : "currentColor"} fillOpacity={isActive ? 1 : 0.7} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1} />
    {isActive && (
      <path d="M6 13 L12 9 L18 4" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

const PillIcon = ({ isActive }: { isActive?: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20.5L3.5 13.5C2.1 12.1 2.1 9.9 3.5 8.5L8.5 3.5C9.9 2.1 12.1 2.1 13.5 3.5L20.5 10.5C21.9 11.9 21.9 14.1 20.5 15.5L15.5 20.5C14.1 21.9 11.9 21.9 10.5 20.5Z" fill={isActive ? "currentColor" : "none"} fillOpacity={isActive ? 0.15 : 0} />
    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
  </svg>
);

// Tab configuration
interface TabConfig {
  icon: 'home' | 'calendar' | 'chart' | 'pill';
  label: string;
  path: string;
}

const tabConfig: TabConfig[] = [
  { icon: 'home', label: 'Bugün', path: '/' },
  { icon: 'calendar', label: 'Takvim', path: '/calendar' },
  { icon: 'chart', label: 'İstatistik', path: '/stats' },
  { icon: 'pill', label: 'İlaçlar', path: '/medications' },
];

// Spring animation config - smooth but lively
const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Render icon component
function TabIcon({ type, isActive }: { type: string; isActive: boolean }) {
  const iconProps = { isActive };
  switch (type) {
    case 'home': return <HomeIcon {...iconProps} />;
    case 'calendar': return <CalendarIcon {...iconProps} />;
    case 'chart': return <ChartIcon {...iconProps} />;
    case 'pill': return <PillIcon {...iconProps} />;
    default: return null;
  }
}

interface BottomNavProps {
  onCenterPress?: (tab?: 'flow' | 'symptoms' | 'mood') => void;
}

export function BottomNav({ onCenterPress }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // Get active tab index for positioning
  const getActiveIndex = () => {
    const leftTabs = tabConfig.slice(0, 2);
    const rightTabs = tabConfig.slice(2);
    
    const leftIndex = leftTabs.findIndex(t => t.path === location.pathname);
    if (leftIndex !== -1) return { side: 'left', index: leftIndex };
    
    const rightIndex = rightTabs.findIndex(t => t.path === location.pathname);
    if (rightIndex !== -1) return { side: 'right', index: rightIndex };
    
    return { side: 'left', index: 0 };
  };

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

  // Tab item component with animations
  const TabItem = ({ tab, isActive }: { tab: TabConfig; isActive: boolean }) => (
    <motion.button
      onClick={() => handleTap(tab.path)}
      className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[72px]"
      whileTap={{ scale: 0.92 }}
      transition={springConfig}
    >
      {/* Animated pill highlight behind active tab */}
      {isActive && (
        <motion.div
          layoutId="activeTabPill"
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
          }}
          transition={springConfig}
        />
      )}
      
      {/* Icon container with scale animation */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: isActive ? 1.12 : 1,
          y: isActive ? -2 : 0,
        }}
        transition={springConfig}
      >
        {/* Soft radial gradient glow behind active icon */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 -m-2 rounded-full blur-md"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
            }}
          />
        )}
        
        <div className={`relative transition-colors duration-200 ${
          isActive ? 'text-primary' : 'text-muted-foreground/60'
        }`}>
          <TabIcon type={tab.icon} isActive={isActive} />
        </div>
      </motion.div>
      
      {/* Label with opacity animation */}
      <motion.span
        className={`text-[10px] font-semibold mt-1.5 z-10 ${
          isActive ? 'text-primary' : 'text-muted-foreground/50'
        }`}
        animate={{
          opacity: isActive ? 1 : 0.6,
        }}
        transition={{ duration: 0.2 }}
      >
        {tab.label}
      </motion.span>
      
      {/* Bottom glow line for active tab */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={springConfig}
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
              boxShadow: '0 0 8px 2px hsl(var(--primary) / 0.4)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );

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
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
