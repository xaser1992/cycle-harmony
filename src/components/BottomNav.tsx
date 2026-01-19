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

// Fresh icon designs with tap animation support
const HomeIcon = ({ className, isActive, isTapped }: { className?: string; isActive?: boolean; isTapped?: boolean }) => (
  <svg className={`${className} ${isTapped ? 'animate-icon-tap' : ''}`} viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const CalendarIcon = ({ className, isActive, isTapped }: { className?: string; isActive?: boolean; isTapped?: boolean }) => (
  <svg className={`${className} ${isTapped ? 'animate-icon-tap' : ''}`} viewBox="0 0 24 24" fill="none">
    {/* Calendar body */}
    <rect x="3" y="5" width="18" height="17" rx="2.5" fill={isActive ? "hsl(var(--primary))" : "hsl(var(--muted))"} fillOpacity={isActive ? 0.15 : 0.5} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1.5} />
    {/* Red ribbon top */}
    <rect x="3" y="5" width="18" height="4" rx="2.5" fill={isActive ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"} fillOpacity={isActive ? 1 : 0.4} />
    {/* Calendar pins */}
    <line x1="8" y1="3" x2="8" y2="7" stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={2} strokeLinecap="round" />
    <line x1="16" y1="3" x2="16" y2="7" stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={2} strokeLinecap="round" />
    {/* Date number */}
    <text x="12" y="17" textAnchor="middle" fontSize={isActive ? "8" : "7"} fontWeight="bold" fill={isActive ? "hsl(var(--primary))" : "currentColor"}>
      {new Date().getDate()}
    </text>
  </svg>
);

const ChartIcon = ({ className, isActive, isTapped }: { className?: string; isActive?: boolean; isTapped?: boolean }) => (
  <svg className={`${className} ${isTapped ? 'animate-icon-tap' : ''}`} viewBox="0 0 24 24" fill="none">
    {/* Bar chart - growth style */}
    <rect x="4" y="14" width="4" height="7" rx="1" fill={isActive ? "hsl(var(--primary))" : "currentColor"} fillOpacity={isActive ? 0.5 : 0.3} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1} />
    <rect x="10" y="10" width="4" height="11" rx="1" fill={isActive ? "hsl(var(--primary))" : "currentColor"} fillOpacity={isActive ? 0.7 : 0.5} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1} />
    <rect x="16" y="5" width="4" height="16" rx="1" fill={isActive ? "hsl(var(--primary))" : "currentColor"} fillOpacity={isActive ? 1 : 0.7} stroke={isActive ? "hsl(var(--primary))" : "currentColor"} strokeWidth={1} />
    {/* Trend line */}
    {isActive && (
      <path d="M6 13 L12 9 L18 4" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0" />
    )}
  </svg>
);

const PillIcon = ({ className, isActive, isTapped }: { className?: string; isActive?: boolean; isTapped?: boolean }) => (
  <svg className={`${className} ${isTapped ? 'animate-icon-tap' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20.5L3.5 13.5C2.1 12.1 2.1 9.9 3.5 8.5L8.5 3.5C9.9 2.1 12.1 2.1 13.5 3.5L20.5 10.5C21.9 11.9 21.9 14.1 20.5 15.5L15.5 20.5C14.1 21.9 11.9 21.9 10.5 20.5Z" fill={isActive ? "currentColor" : "none"} fillOpacity={isActive ? 0.15 : 0} />
    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
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
function NavIcon({ type, className, isActive, isTapped }: { type: string; className: string; isActive: boolean; isTapped: boolean }) {
  switch (type) {
    case 'home':
      return <HomeIcon className={className} isActive={isActive} isTapped={isTapped} />;
    case 'calendar':
      return <CalendarIcon className={className} isActive={isActive} isTapped={isTapped} />;
    case 'chart':
      return <ChartIcon className={className} isActive={isActive} isTapped={isTapped} />;
    case 'pill':
      return <PillIcon className={className} isActive={isActive} isTapped={isTapped} />;
    default:
      return null;
  }
}

export function BottomNav({ onCenterPress }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [tappedIcon, setTappedIcon] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTap = useCallback((path: string, iconType: string) => {
    setTappedIcon(iconType);
    setTimeout(() => setTappedIcon(null), 300);
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
          const isTapped = tappedIcon === item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item.path, item.icon)}
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
                  isTapped={isTapped}
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
          const isTapped = tappedIcon === item.icon;
          return (
            <button
              key={item.path}
              onClick={() => handleTap(item.path, item.icon)}
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
                  isTapped={isTapped}
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
