// 🌸 Swipe Navigation Hook - Tab arası geçiş için
// IMPORTANT: Only use this hook ONCE in the app (e.g., in BottomNav or App layout)
// With KeepAlive, multiple instances would register duplicate listeners
import { useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Tab sırası (+ butonu atlanıyor)
const TAB_ORDER = ['/', '/calendar', '/stats', '/medications'];

interface SwipeOptions {
  threshold?: number; // Minimum swipe mesafesi (px)
  enabled?: boolean;
}

export function useSwipeNavigation(options: SwipeOptions = {}) {
  const { threshold = 50, enabled = true } = options;
  const navigate = useNavigate();
  const location = useLocation();
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef(false);
  // Use ref to always have current pathname in event handlers
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = TAB_ORDER.indexOf(pathnameRef.current);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'left') {
      newIndex = currentIndex + 1;
      if (newIndex >= TAB_ORDER.length) return;
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) return;
    }

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    navigate(TAB_ORDER[newIndex]);
  }, [navigate]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (deltaY > deltaX) {
        isSwiping.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX.current;
      
      if (Math.abs(deltaX) >= threshold) {
        if (deltaX < 0) {
          navigateToTab('left');
        } else {
          navigateToTab('right');
        }
      }
      
      isSwiping.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, navigateToTab]);

  return {
    currentTabIndex: TAB_ORDER.indexOf(location.pathname),
    totalTabs: TAB_ORDER.length,
  };
}
