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
      {/* Glass background */}
      <div 
        className="absolute inset-0 border-t border-white/20"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
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

        {/* Center FAB Button */}
        <div className="relative -mt-8 mx-2">
          <button
            onClick={handleCenterPress}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary via-period to-primary flex items-center justify-center active:scale-90 transition-all duration-200"
            style={{
              boxShadow: '0 4px 20px -2px hsl(var(--primary) / 0.5)',
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
// Simple Tab Icons matching old design
// ============================================

// Home Icon - Flower/Lotus
function HomeIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-11 h-11">
        {/* Gradient background pill */}
        <div 
          className="absolute inset-0 rounded-xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)',
          }}
        />
        {/* Flower icon */}
        <svg className="relative z-10 w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 8 6 8 10C8 14 12 16 12 16C12 16 16 14 16 10C16 6 12 2 12 2Z" />
          <path d="M5 8C5 8 3 11 4 14C5 17 9 18 9 18C9 18 7 14 7 11C7 8 5 8 5 8Z" opacity="0.7" />
          <path d="M19 8C19 8 21 11 20 14C19 17 15 18 15 18C15 18 17 14 17 11C17 8 19 8 19 8Z" opacity="0.7" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className="w-6 h-6">
      <svg className="w-full h-full text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3C12 3 8 7 8 11C8 15 12 17 12 17C12 17 16 15 16 11C16 7 12 3 12 3Z" />
        <path d="M6 8C6 8 4 11 5 14C6 17 10 18 10 18" strokeLinecap="round" />
        <path d="M18 8C18 8 20 11 19 14C18 17 14 18 14 18" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Calendar Icon - Simple square calendar
function CalendarIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-11 h-11">
        {/* Gradient background pill */}
        <div 
          className="absolute inset-0 rounded-xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #2dd4bf 0%, #f472b6 100%)',
          }}
        />
        {/* Calendar icon */}
        <div className="relative z-10 w-5 h-6 flex flex-col rounded border-2 border-white overflow-hidden">
          <div className="h-1.5 bg-white/90" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">{new Date().getDate()}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-6 h-7">
      <div className="w-full h-full flex flex-col rounded border-2 border-muted-foreground/40 overflow-hidden">
        <div className="h-1.5 bg-muted-foreground/40" />
        <div className="flex-1" />
      </div>
    </div>
  );
}

// Stats Icon - Bar chart
function StatsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-11 h-11">
        {/* Gradient background pill */}
        <div 
          className="absolute inset-0 rounded-xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)',
          }}
        />
        {/* Bar chart icon */}
        <div className="relative z-10 flex items-end gap-0.5 h-5">
          <div className="w-1 h-2 bg-white rounded-t-sm animate-bar-1" style={{ transformOrigin: 'bottom' }} />
          <div className="w-1 h-3.5 bg-white rounded-t-sm animate-bar-2" style={{ transformOrigin: 'bottom' }} />
          <div className="w-1 h-2.5 bg-white rounded-t-sm animate-bar-3" style={{ transformOrigin: 'bottom' }} />
          <div className="w-1 h-4.5 bg-white rounded-t-sm animate-bar-4" style={{ transformOrigin: 'bottom' }} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-end gap-0.5 h-5">
      <div className="w-1 h-2 bg-muted-foreground/40 rounded-t-sm" />
      <div className="w-1 h-3.5 bg-muted-foreground/40 rounded-t-sm" />
      <div className="w-1 h-2.5 bg-muted-foreground/40 rounded-t-sm" />
      <div className="w-1 h-4 bg-muted-foreground/40 rounded-t-sm" />
    </div>
  );
}

// Medications Icon - Pill capsule
function MedicationsIcon({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="relative flex items-center justify-center w-11 h-11">
        {/* Gradient background pill */}
        <div 
          className="absolute inset-0 rounded-xl animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #fb923c 0%, #fbbf24 100%)',
          }}
        />
        {/* Capsule icon */}
        <div className="relative z-10 w-6 h-3 flex rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-br from-orange-500 to-red-500" />
          <div className="w-1/2 h-full bg-gradient-to-bl from-yellow-400 to-amber-500" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-6 h-3">
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
      className={`relative flex flex-col items-center justify-center py-1 px-3 min-w-[72px] transition-all duration-200 active:scale-90 ${
        isActive ? 'text-foreground' : 'text-muted-foreground/50'
      }`}
    >
      {/* Icon container */}
      <div className="h-11 flex items-center justify-center">
        {renderIcon()}
      </div>
      
      {/* Label */}
      <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
        {tab.label}
      </span>
    </button>
  );
}