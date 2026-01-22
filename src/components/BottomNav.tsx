// 🌸 Bottom Navigation Component - Performance Optimized (No framer-motion)
import { useCallback, forwardRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

interface BottomNavProps {
  onCenterPress?: (tab?: 'flow' | 'symptoms' | 'mood') => void;
}

export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(function BottomNav({ onCenterPress }, ref) {
  const location = useLocation();
  const navigate = useNavigate();

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
      {/* True Glass/Frosted background - More transparent */}
      <div 
        className="absolute inset-0 border-t border-white/30"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      />
      
      {/* Subtle inner glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(255,255,255,0.1), transparent 50%)',
        }}
      />

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
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary via-period to-primary flex items-center justify-center active:scale-90 transition-all duration-200 hover:shadow-2xl"
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
// Animated Tab Icons with Gradient Backgrounds
// ============================================

// Home Icon - Active: Glowing flower with gradient bg, Inactive: Simple outline
function HomeIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Gradient background pill */}
        <div 
          className="absolute w-12 h-12 rounded-2xl animate-tab-pill-in"
          style={{
            background: 'linear-gradient(135deg, #f472b6 0%, #fbbf24 100%)',
            boxShadow: '0 4px 15px rgba(244, 114, 182, 0.4)',
          }}
        />
        {/* Animated flower icon */}
        <div className="relative z-10 animate-tab-icon-bounce">
          <svg className="w-6 h-6 drop-shadow-lg" viewBox="0 0 24 24" fill="none">
            {/* Center petal */}
            <path
              d="M12 3C12 3 8 7 8 11C8 15 12 17 12 17C12 17 16 15 16 11C16 7 12 3 12 3Z"
              fill="white"
              className="animate-petal-center"
            />
            {/* Left petal */}
            <path
              d="M6 8C6 8 4 12 5 15C6 18 10 19 10 19C10 19 8 15 8 12C8 9 6 8 6 8Z"
              fill="rgba(255,255,255,0.8)"
              className="animate-petal-left"
            />
            {/* Right petal */}
            <path
              d="M18 8C18 8 20 12 19 15C18 18 14 19 14 19C14 19 16 15 16 12C16 9 18 8 18 8Z"
              fill="rgba(255,255,255,0.8)"
              className="animate-petal-right"
            />
            {/* Center dot */}
            <circle cx="12" cy="12" r="2" fill="#fbbf24" className="animate-petal-dot" />
          </svg>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <svg className="w-6 h-6 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 4C12 4 8 8 8 11.5C8 15 12 17 12 17C12 17 16 15 16 11.5C16 8 12 4 12 4Z" />
        <path d="M6 9C6 9 4 12 5 15C6 18 10 19 10 19" strokeLinecap="round" />
        <path d="M18 9C18 9 20 12 19 15C18 18 14 19 14 19" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Calendar Icon - Active: Calendar with date and gradient bg, Inactive: Simple outline
function CalendarIcon({ isActive }: { isActive: boolean }) {
  const todayDate = new Date().getDate();
  
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Gradient background pill */}
        <div 
          className="absolute w-12 h-12 rounded-2xl animate-tab-pill-in"
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #f472b6 100%)',
            boxShadow: '0 4px 15px rgba(45, 212, 191, 0.4)',
          }}
        />
        {/* Calendar icon with date */}
        <div className="relative z-10 animate-tab-icon-bounce">
          <div className="w-7 h-8 flex flex-col overflow-hidden rounded-md border-2 border-white/80 bg-white/20 backdrop-blur-sm">
            {/* Calendar header */}
            <div className="w-full h-2.5 bg-white/90 flex items-center justify-center gap-1">
              <div className="w-0.5 h-1 rounded-full bg-teal-500/70" />
              <div className="w-0.5 h-1 rounded-full bg-teal-500/70" />
            </div>
            {/* Calendar body */}
            <div className="flex-1 flex items-center justify-center bg-white/10">
              <span className="text-sm font-bold text-white drop-shadow-md animate-calendar-date">
                {todayDate}
              </span>
            </div>
          </div>
        </div>
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

// Stats/Chart Icon - Active: Animated bars with gradient bg, Inactive: Static bars
function StatsIcon({ isActive }: { isActive: boolean }) {
  const barHeights = [0.4, 0.7, 0.5, 0.9];
  const barClasses = ['animate-bar-1', 'animate-bar-2', 'animate-bar-3', 'animate-bar-4'];
  
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Gradient background pill */}
        <div 
          className="absolute w-12 h-12 rounded-2xl animate-tab-pill-in"
          style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)',
            boxShadow: '0 4px 15px rgba(129, 140, 248, 0.4)',
          }}
        />
        {/* Animated chart bars */}
        <div className="relative z-10 flex items-end justify-center gap-0.5 h-6 animate-tab-icon-bounce">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 bg-white rounded-t-sm ${barClasses[i]}`}
              style={{ 
                height: `${height * 100}%`,
                transformOrigin: 'bottom',
                boxShadow: '0 0 6px rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
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

// Medications/Pill Icon - Active: Colorful pill with gradient bg, Inactive: Simple pill
function MedicationsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center">
        {/* Gradient background pill */}
        <div 
          className="absolute w-12 h-12 rounded-2xl animate-tab-pill-in"
          style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #fbbf24 100%)',
            boxShadow: '0 4px 15px rgba(251, 146, 60, 0.4)',
          }}
        />
        {/* Pill capsule icon */}
        <div className="relative z-10 w-8 h-5 animate-tab-icon-bounce">
          <div className="w-full h-full flex rounded-full overflow-hidden shadow-lg animate-pill-capsule">
            {/* Left half - orange/red */}
            <div className="w-1/2 h-full bg-gradient-to-br from-orange-500 to-red-500" />
            {/* Right half - yellow */}
            <div className="w-1/2 h-full bg-gradient-to-bl from-yellow-400 to-amber-500" />
          </div>
          {/* Center line shine */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-white/60" />
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
    <button
      onClick={() => onTap(tab.path)}
      className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[72px] rounded-xl transition-all duration-300 active:scale-90 ${
        isActive 
          ? 'text-foreground' 
          : 'text-muted-foreground/50 hover:text-muted-foreground/70'
      }`}
    >
      {/* Icon container */}
      <div className="relative z-10 h-12 flex items-center justify-center">
        {renderIcon()}
      </div>
      
      {/* Label */}
      <span
        className={`text-[10px] font-medium truncate w-full leading-tight transition-all duration-300 mt-0.5 ${
          isActive ? 'opacity-100 font-semibold text-foreground' : 'opacity-60'
        }`}
      >
        {tab.label}
      </span>
    </button>
  );
}
