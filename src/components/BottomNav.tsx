// 🌸 Bottom Navigation Component - Flo Inspired Design
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  icon: React.FC<{ className?: string; isActive?: boolean }>;
  label: string;
  path: string;
}

// Custom Flo-style icons
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
    {isActive && (
      <>
        <circle cx="12" cy="15" r="2" fill="currentColor" stroke="none" />
      </>
    )}
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

const navItems: NavItem[] = [
  { icon: HomeIcon, label: 'Bugün', path: '/' },
  { icon: CalendarIcon, label: 'Takvim', path: '/calendar' },
  { icon: ChartIcon, label: 'İstatistik', path: '/stats' },
  { icon: SettingsIcon, label: 'Ayarlar', path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center py-2 px-5 rounded-2xl transition-all duration-300"
              whileTap={{ scale: 0.92 }}
            >
              {/* Active background pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/12 rounded-2xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}
              
              {/* Icon container */}
              <motion.div 
                className="relative z-10"
                animate={{ 
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <IconComponent 
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  isActive={isActive}
                />
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={`text-[11px] font-medium mt-1 relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                animate={{ 
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 500
                }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
