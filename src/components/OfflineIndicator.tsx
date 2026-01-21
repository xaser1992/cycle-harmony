// 🌸 Offline Indicator - Performance Optimized (No framer-motion)
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOfflineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-slide-down">
        <WifiOff className="h-4 w-4" />
        <span>Çevrimdışı mod - Veriler yerel olarak kaydediliyor</span>
      </div>
    );
  }

  if (showReconnected && isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-slide-down">
        <Wifi className="h-4 w-4" />
        <span>Bağlantı yeniden kuruldu</span>
      </div>
    );
  }

  return null;
}
