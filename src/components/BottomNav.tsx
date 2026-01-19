// 🌸 Bottom Navigation Component - Flo Inspired Design
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface NavItem {
  icon: React.FC<{ className?: string; isActive?: boolean }>;
  label: string;
  path: string;
}

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

const navItems: NavItem[] = [
  { icon: HomeIcon, label: 'Bugün', path: '/' },
  { icon: CalendarIcon, label: 'Takvim', path: '/calendar' },
  { icon: ChartIcon, label: 'İstatistik', path: '/stats' },
  { icon: SettingsIcon, label: 'Ayarlar', path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  const handleTap = (path: string) => {
    setTappedItem(path);
    navigate(path);
    setTimeout(() => setTappedItem(null), 600);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/40 safe-area-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isTapped = tappedItem === item.path;
          const IconComponent = item.icon;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => handleTap(item.path)}
              className="relative flex flex-col items-center py-2 px-6 rounded-2xl transition-all duration-300 overflow-hidden"
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
        })}
      </div>
    </nav>
  );
}