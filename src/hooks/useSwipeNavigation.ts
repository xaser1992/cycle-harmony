// 🌸 Swipe Navigation Hook - Tab arası geçiş için
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

  const getCurrentIndex = useCallback(() => {
    return TAB_ORDER.indexOf(location.pathname);
  }, [location.pathname]);

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'left') {
      // Sola kaydır = sonraki tab
      newIndex = currentIndex + 1;
      if (newIndex >= TAB_ORDER.length) return; // Son tab'da durma
    } else {
      // Sağa kaydır = önceki tab
      newIndex = currentIndex - 1;
      if (newIndex < 0) return; // İlk tab'da durma
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    navigate(TAB_ORDER[newIndex]);
  }, [getCurrentIndex, navigate]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      
      // Dikey scroll'u engellememek için kontrol
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      
      // Eğer dikey hareket yatayla aynı veya fazlaysa, swipe'ı iptal et
      if (deltaY > deltaX) {
        isSwiping.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX.current;
      
      // Minimum threshold kontrolü
      if (Math.abs(deltaX) >= threshold) {
        if (deltaX < 0) {
          // Sola kaydırma = sonraki sayfa
          navigateToTab('left');
        } else {
          // Sağa kaydırma = önceki sayfa
          navigateToTab('right');
        }
      }
      
      isSwiping.current = false;
    };

    // Global touch events
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
    currentTabIndex: getCurrentIndex(),
    totalTabs: TAB_ORDER.length,
  };
}
