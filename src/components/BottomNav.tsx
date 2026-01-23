// 🌸 Bottom Navigation Component - Matching Original Video Design
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
      {/* Glass background */}
      <div 
        className="absolute inset-0 border-t border-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      />

      <div className="relative flex items-center justify-around h-16 px-2">
        {/* Left tabs */}
        <div className="flex items-center justify-around flex-1">
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
        <div className="relative -mt-6 mx-3">
          <button
            onClick={handleCenterPress}
            className="relative w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform duration-150"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--period)) 100%)',
              boxShadow: '0 4px 15px -2px hsl(var(--primary) / 0.4)',
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
        <div className="flex items-center justify-around flex-1">
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
// Tab Icons - Original Video Design
// ============================================

// Home Icon - Lotus Flower (Video style)
function HomeIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Gradient pill background */}
        <div 
          className="absolute inset-0 rounded-2xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
          }}
        />
        {/* Lotus flower - filled */}
        <svg className="relative z-10 w-5 h-5" viewBox="0 0 24 24" fill="white">
          {/* Center petal */}
          <ellipse cx="12" cy="10" rx="3" ry="6" />
          {/* Left petal */}
          <ellipse cx="7" cy="12" rx="2.5" ry="5" transform="rotate(-30 7 12)" opacity="0.85" />
          {/* Right petal */}
          <ellipse cx="17" cy="12" rx="2.5" ry="5" transform="rotate(30 17 12)" opacity="0.85" />
          {/* Small outer left */}
          <ellipse cx="4" cy="14" rx="2" ry="4" transform="rotate(-50 4 14)" opacity="0.6" />
          {/* Small outer right */}
          <ellipse cx="20" cy="14" rx="2" ry="4" transform="rotate(50 20 14)" opacity="0.6" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className="w-6 h-6">
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth="1.5">
        {/* Center petal */}
        <ellipse cx="12" cy="10" rx="3" ry="6" />
        {/* Left petal */}
        <ellipse cx="7" cy="12" rx="2.5" ry="5" transform="rotate(-30 7 12)" />
        {/* Right petal */}
        <ellipse cx="17" cy="12" rx="2.5" ry="5" transform="rotate(30 17 12)" />
      </svg>
    </div>
  );
}

// Calendar Icon (Video style)
function CalendarIcon({ isActive }: { isActive: boolean }) {
  const day = new Date().getDate();
  
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Gradient pill background */}
        <div 
          className="absolute inset-0 rounded-2xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #ec4899 100%)',
          }}
        />
        {/* Calendar frame */}
        <div className="relative z-10 w-5 h-5 flex flex-col rounded-sm border-[1.5px] border-white overflow-hidden bg-white/20">
          {/* Header bar */}
          <div className="h-1.5 bg-white" />
          {/* Date number */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white leading-none">{day}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-6 h-6">
      <div className="w-full h-full flex flex-col rounded-sm border-[1.5px] border-muted-foreground/40 overflow-hidden">
        <div className="h-1.5 bg-muted-foreground/40" />
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[8px] font-medium text-muted-foreground/50 leading-none">{day}</span>
        </div>
      </div>
    </div>
  );
}

// Stats Icon - Bar Chart (Video style)
function StatsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Gradient pill background */}
        <div 
          className="absolute inset-0 rounded-2xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          }}
        />
        {/* Bar chart */}
        <div className="relative z-10 flex items-end gap-[3px] h-4">
          <div className="w-1 h-[6px] bg-white rounded-t-[1px] animate-bar-1" />
          <div className="w-1 h-[10px] bg-white rounded-t-[1px] animate-bar-2" />
          <div className="w-1 h-[8px] bg-white rounded-t-[1px] animate-bar-3" />
          <div className="w-1 h-[14px] bg-white rounded-t-[1px] animate-bar-4" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-end gap-[3px] h-5">
      <div className="w-1 h-[6px] bg-muted-foreground/40 rounded-t-[1px]" />
      <div className="w-1 h-[10px] bg-muted-foreground/40 rounded-t-[1px]" />
      <div className="w-1 h-[8px] bg-muted-foreground/40 rounded-t-[1px]" />
      <div className="w-1 h-[14px] bg-muted-foreground/40 rounded-t-[1px]" />
    </div>
  );
}

// Medications Icon - Pill Capsule (Video style)
function MedicationsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        {/* Gradient pill background */}
        <div 
          className="absolute inset-0 rounded-2xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)',
          }}
        />
        {/* Capsule pill */}
        <div className="relative z-10 w-5 h-2.5 flex rounded-full overflow-hidden rotate-[-30deg]">
          <div className="w-1/2 h-full bg-white" />
          <div className="w-1/2 h-full bg-white/60" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-5 h-2.5 rotate-[-30deg]">
      <div className="w-full h-full flex rounded-full overflow-hidden border border-muted-foreground/40">
        <div className="w-1/2 h-full bg-muted-foreground/40" />
        <div className="w-1/2 h-full bg-muted-foreground/20" />
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
      className="relative flex flex-col items-center justify-center py-1 px-2 min-w-[60px] transition-transform duration-150 active:scale-95"
    >
      {/* Icon container */}
      <div className="h-10 flex items-center justify-center">
        {renderIcon()}
      </div>
      
      {/* Label */}
      <span 
        className={`text-[10px] font-medium mt-0.5 transition-colors duration-200 ${
          isActive 
            ? 'text-foreground' 
            : 'text-muted-foreground/50'
        }`}
      >
        {tab.label}
      </span>
    </button>
  );
}
