// 🌸 Bottom Navigation Component - Performance Optimized
import { useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

// Updated icons with new designs
const HomeIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const CalendarIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const ChartIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const PillIcon = ({ className, isActive }: { className?: string; isActive?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

interface NavItemData {
  icon: 'home' | 'calendar' | 'chart' | 'pill';
  label: string;
  path: string;
}

const navItems: NavItemData[] = [
  { icon: 'home', label: 'Bugün', path: '/' },
  { icon: 'calendar', label: 'Takvim', path: '/calendar' },
  { icon: 'chart', label: 'İstatistik', path: '/stats' },
  { icon: 'pill', label: 'İlaçlar', path: '/medications' },
];

interface BottomNavProps {
  onCenterPress?: (tab?: 'flow' | 'symptoms' | 'mood') => void;
}

// Render icon based on type
function NavIcon({ type, className, isActive }: { type: string; className: string; isActive: boolean }) {
  switch (type) {
    case 'home':
      return <HomeIcon className={className} isActive={isActive} />;
    case 'calendar':
      return <CalendarIcon className={className} isActive={isActive} />;
    case 'chart':
      return <ChartIcon className={className} isActive={isActive} />;
    case 'pill':
      return <PillIcon className={className} isActive={isActive} />;
    default:
      return null;
  }
}

export function BottomNav({ onCenterPress }: BottomNavProps) {
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border/40 safe-area-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1.5">
        {/* Left nav items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item.path)}
              className={`relative flex flex-col items-center py-2 px-4 rounded-2xl transition-transform duration-150 active:scale-90 ${
                isActive ? 'bg-primary/10' : ''
              }`}
            >
              <div className={`transition-transform duration-150 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <NavIcon 
                  type={item.icon}
                  className={`w-6 h-6 transition-colors duration-150 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  isActive={isActive}
                />
              </div>
              <span className={`text-[11px] font-semibold mt-1 transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-muted-foreground/70'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
        
        {/* Center Plus Button */}
        <div className="relative -mt-6">
          {/* Quick Actions Popup */}
          {showQuickActions && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setShowQuickActions(false)}
              />
              
              {quickActions.map((action, index) => {
                const positions = [
                  { x: -60, y: -70 },
                  { x: 0, y: -90 },
                  { x: 60, y: -70 },
                ];
                const pos = positions[index];
                
                return (
                  <button
                    key={action.tab}
                    onClick={() => handleQuickAction(action.tab)}
                    className={`absolute z-50 flex flex-col items-center gap-1 p-3 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-xl transition-transform duration-200 active:scale-90`}
                    style={{ 
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                    }}
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-[10px] font-medium text-white whitespace-nowrap">{action.label}</span>
                  </button>
                );
              })}
            </>
          )}

          <button
            onClick={handleCenterPress}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 shadow-lg shadow-rose-500/40 flex items-center justify-center transition-transform duration-150 active:scale-90"
          >
            <svg
              className={`w-7 h-7 text-white transition-transform duration-200 ${showQuickActions ? 'rotate-45' : ''}`}
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
        
        {/* Right nav items */}
        {navItems.slice(2).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item.path)}
              className={`relative flex flex-col items-center py-2 px-4 rounded-2xl transition-transform duration-150 active:scale-90 ${
                isActive ? 'bg-primary/10' : ''
              }`}
            >
              <div className={`transition-transform duration-150 ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}>
                <NavIcon 
                  type={item.icon}
                  className={`w-6 h-6 transition-colors duration-150 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  isActive={isActive}
                />
              </div>
              <span className={`text-[11px] font-semibold mt-1 transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-muted-foreground/70'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
