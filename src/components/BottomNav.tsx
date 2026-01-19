// 🌸 Bottom Navigation Component - Flo Inspired Design
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';

interface NavItem {
  icon: React.FC<{ className?: string; isActive?: boolean }>;
  label: string;
  path: string;
}

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

// Custom Flo-style icons with enhanced details
const HomeIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    {isActive && <circle cx="12" cy="14" r="3" fill="currentColor" stroke="none" />}
  </svg>
);

const CalendarIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    {isActive && <circle cx="12" cy="15" r="2" fill="currentColor" stroke="none" />}
  </svg>
);

const ChartIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
    {isActive && (
      <>
        <circle cx="18" cy="10" r="2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
        <circle cx="6" cy="14" r="2" fill="currentColor" stroke="none" />
      </>
    )}
  </svg>
);

const SettingsIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" fill={isActive ? "currentColor" : "none"} />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const leftNavItems: NavItem[] = [
  { icon: HomeIcon, label: 'Bugün', path: '/' },
  { icon: CalendarIcon, label: 'Takvim', path: '/calendar' },
];

const rightNavItems: NavItem[] = [
  { icon: ChartIcon, label: 'İstatistik', path: '/stats' },
  { icon: SettingsIcon, label: 'Ayarlar', path: '/settings' },
];

interface BottomNavProps {
  onCenterPress?: (tab?: 'flow' | 'symptoms' | 'mood') => void;
}

export function BottomNav({ onCenterPress }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  const [isCenterPressed, setIsCenterPressed] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTap = (path: string) => {
    setTappedItem(path);
    navigate(path);
    setTimeout(() => setTappedItem(null), 600);
  };

  const handleCenterPress = () => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    setIsCenterPressed(true);
    onCenterPress?.();
    setTimeout(() => setIsCenterPressed(false), 300);
  };

  const handleLongPressStart = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowQuickActions(true);
      // Haptic feedback simulation
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

  const handleQuickAction = (tab: 'flow' | 'symptoms' | 'mood') => {
    setShowQuickActions(false);
    onCenterPress?.(tab);
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const isTapped = tappedItem === item.path;
    const IconComponent = item.icon;
    
    return (
      <motion.button
        key={item.path}
        onClick={() => handleTap(item.path)}
        className="relative flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-300 overflow-hidden"
        whileTap={{ scale: 0.88 }}
      >
        {/* Ripple effect on tap */}
        <AnimatePresence>
          {isTapped && (
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-2xl"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        {/* Active background pill with glow */}
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl"
            initial={false}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 28
            }}
          >
            {/* Subtle glow effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.2), transparent 70%)',
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
        
        {/* Icon container with bounce */}
        <motion.div 
          className="relative z-10"
          animate={isActive ? { 
            scale: [1, 1.15, 1.05],
            y: [0, -3, -1],
            rotate: [0, -3, 3, 0],
          } : { 
            scale: 1,
            y: 0,
            rotate: 0
          }}
          transition={isActive ? { 
            duration: 0.5, 
            ease: "easeOut",
            times: [0, 0.4, 1]
          } : {
            duration: 0.2
          }}
        >
          {/* Pulse ring for active state */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="absolute inset-0 -m-1 rounded-full border-2 border-primary/30"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.4, 1.6],
                  opacity: [0.6, 0.3, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
          </AnimatePresence>
          
          <IconComponent 
            className={`w-6 h-6 transition-colors duration-300 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
            isActive={isActive}
          />
        </motion.div>
        
        {/* Label with fade effect */}
        <motion.span 
          className={`text-[11px] font-medium mt-1.5 relative z-10 transition-all duration-300 ${
            isActive ? 'text-primary' : 'text-muted-foreground/70'
          }`}
          animate={{ 
            opacity: isActive ? 1 : 0.7,
            y: isActive ? 0 : 1
          }}
        >
          {item.label}
        </motion.span>

        {/* Active dot indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-primary"
              initial={{ scale: 0, x: "-50%" }}
              animate={{ scale: 1, x: "-50%" }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/40 safe-area-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1.5">
        {/* Left nav items */}
        {leftNavItems.map(renderNavItem)}
        
        {/* Center Plus Button */}
        <div className="relative -mt-6">
          {/* Quick Actions Popup */}
          <AnimatePresence>
            {showQuickActions && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="fixed inset-0 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowQuickActions(false)}
                />
                
                {/* Quick Action Buttons */}
                <motion.div
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-3 z-50"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.tab}
                      onClick={() => handleQuickAction(action.tab)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-[10px] font-medium text-white">{action.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleCenterPress}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 shadow-lg shadow-rose-500/40 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 blur-lg opacity-60"
              animate={{ 
                opacity: [0.4, 0.6, 0.4],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Ripple on press */}
            <AnimatePresence>
              {isCenterPressed && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/30"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </AnimatePresence>
            
            {/* Plus icon */}
            <motion.svg
              className="w-7 h-7 text-white relative z-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={showQuickActions ? { rotate: 45 } : isCenterPressed ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </motion.svg>
          </motion.button>
          
          {/* Label */}
          <motion.span 
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/70 whitespace-nowrap"
          >
            Güncelle
          </motion.span>
        </div>
        
        {/* Right nav items */}
        {rightNavItems.map(renderNavItem)}
      </div>
    </nav>
  );
}