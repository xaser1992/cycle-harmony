// 🌸 Debug Panel - Notification Diagnostics
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Bell, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  Smartphone,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useCycleData } from '@/hooks/useCycleData';
import { 
  checkNotificationPermissions, 
  requestNotificationPermissions,
  sendTestNotification,
  getPendingNotifications,
  scheduleNotifications,
  cancelAllNotifications,
  cancelScheduledSystemNotifications,
  diagnoseNotifications
} from '@/lib/notifications';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Skeleton component for loading state
function DebugSkeleton() {
  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </header>
      <main className="px-6 pb-6 space-y-6">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="rounded-xl border border-border/50 p-4 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

interface DiagnosticResult {
  isNative: boolean;
  platform: string;
  hasPermission: boolean;
  pendingCount: number;
  systemCount: number;
  customCount: number;
  channelsCreated: boolean;
  channelsApplicable: boolean;
  errors: string[];
}

export default function DebugPage() {
  const navigate = useNavigate();
  const { prediction, notificationPrefs, userSettings, cycleSettings, isLoading: dataLoading } = useCycleData();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState<LocalNotificationSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [lastScheduleResult, setLastScheduleResult] = useState<{ scheduled: number; errors: string[] } | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${format(new Date(), 'HH:mm:ss')}] ${message}`]);
  };

  const runDiagnostics = async () => {
    addLog('🔍 Running full diagnostics...');
    const result = await diagnoseNotifications();
    setDiagnostics(result);
    setHasPermission(result.hasPermission);
    
    if (result.errors.length > 0) {
      result.errors.forEach(err => addLog(`⚠️ ${err}`));
    } else {
      addLog('✓ All diagnostics passed');
    }
    addLog(`📱 Platform: ${result.platform}, Permission: ${result.hasPermission}`);
    addLog(`📊 System: ${result.systemCount}, Custom: ${result.customCount}, Total: ${result.pendingCount}`);
  };

  const checkPermissions = async () => {
    addLog('Checking notification permissions...');
    const granted = await checkNotificationPermissions();
    setHasPermission(granted);
    addLog(granted ? '✓ Permissions granted' : '✗ Permissions denied');
  };

  const requestPermissions = async () => {
    addLog('Requesting notification permissions...');
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    addLog(granted ? '✓ Permissions granted' : '✗ Permissions denied');
    if (granted) {
      await runDiagnostics();
    }
  };

  const loadPendingNotifications = async () => {
    setIsLoading(true);
    addLog('Loading pending notifications...');
    try {
      const pending = await getPendingNotifications();
      setPendingNotifications(pending);
      addLog(`Found ${pending.length} pending notifications`);
      
      // Categorize by type for better visibility
      const waterNotifs = pending.filter(n => n.id >= 900000 && n.id < 1000000);
      const exerciseNotifs = pending.filter(n => n.id >= 1000000 && n.id < 1100000);
      const checkInNotifs = pending.filter(n => n.id >= 800000 && n.id < 900000);
      const cycleNotifs = pending.filter(n => n.id < 800000 && n.id >= 100000);
      const customNotifs = pending.filter(n => n.id >= 50000 && n.id < 100000);
      
      addLog(`  🌸 Cycle: ${cycleNotifs.length}, 📝 Check-in: ${checkInNotifs.length}`);
      addLog(`  💧 Water: ${waterNotifs.length}, 🏃 Exercise: ${exerciseNotifs.length}`);
      if (customNotifs.length > 0) {
        addLog(`  📌 Custom: ${customNotifs.length}`);
      }
    } catch (error) {
      addLog(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    addLog('Sending test notification...');
    try {
      await sendTestNotification(userSettings.language);
      addLog('✓ Test notification sent (should appear in ~1 second)');
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
  };

  const handleReschedule = async () => {
    if (!prediction) {
      addLog('✗ No prediction available - complete onboarding first');
      return;
    }
    
    setIsLoading(true);
    addLog('🔄 Rescheduling all notifications...');
    try {
      const result = await scheduleNotifications(prediction, notificationPrefs, userSettings.language);
      setLastScheduleResult(result);
      
      if (result.errors.length > 0) {
        result.errors.forEach(err => addLog(`⚠️ ${err}`));
      }
      addLog(`✓ Scheduled ${result.scheduled} notifications`);
      await loadPendingNotifications();
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleCancelAll = async () => {
    addLog('Cancelling ALL notifications (including custom)...');
    try {
      await cancelAllNotifications();
      addLog('✓ All notifications cancelled');
      await loadPendingNotifications();
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
  };

  const handleCancelSystemOnly = async () => {
    addLog('Cancelling system notifications only (preserving custom)...');
    try {
      await cancelScheduledSystemNotifications();
      addLog('✓ System notifications cancelled, custom preserved');
      await loadPendingNotifications();
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
  };

  useEffect(() => {
    runDiagnostics();
    loadPendingNotifications();
  }, []);

  if (dataLoading) {
    return <DebugSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/settings')}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Bildirim Tanılama</h1>
      </header>

      <main className="px-6 pb-6 space-y-6">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sistem Durumu</h3>
          <Card className="p-4 space-y-3">
            {/* Platform */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Platform</span>
              </div>
              <span className={`text-sm font-medium ${diagnostics?.isNative ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {diagnostics?.platform === 'android' ? 'Android' : 
                 diagnostics?.platform === 'ios' ? 'iOS' : 
                 'Web (Sınırlı)'}
              </span>
            </div>
            
            {/* Permission */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Bildirim İzni</span>
              </div>
              {hasPermission === null ? (
                <span className="text-sm text-muted-foreground">Kontrol ediliyor...</span>
              ) : hasPermission ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">İzin verildi</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <Button size="sm" variant="outline" onClick={requestPermissions}>
                    İzin İste
                  </Button>
                </div>
              )}
            </div>
            
            {/* Channels - only show on Android */}
            {diagnostics?.channelsApplicable && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Bildirim Kanalları</span>
                </div>
                {diagnostics?.channelsCreated ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Hazır</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Oluşturulmadı</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Notification Counts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Bekleyen Bildirimler</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{diagnostics?.systemCount || 0}</span>
                <span className="text-muted-foreground"> sistem</span>
                {(diagnostics?.customCount || 0) > 0 && (
                  <>
                    <span className="text-muted-foreground">, </span>
                    <span className="font-medium">{diagnostics?.customCount}</span>
                    <span className="text-muted-foreground"> özel</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Preferred Time */}
            
            {/* Preferred Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Tercih Edilen Saat</span>
              </div>
              <span className="text-sm font-medium">{notificationPrefs.preferredTime}</span>
            </div>
            
            {/* Errors */}
            {diagnostics?.errors && diagnostics.errors.length > 0 && (
              <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Sorunlar Tespit Edildi</span>
                </div>
                <div className="space-y-1">
                  {diagnostics.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Predictions */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Tahminler</h3>
            <Card className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sonraki Regl</span>
                <span className="font-medium">
                  {format(parseISO(prediction.nextPeriodStart), 'd MMMM yyyy', { locale: tr })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yumurtlama</span>
                <span className="font-medium">
                  {format(parseISO(prediction.ovulationDate), 'd MMMM yyyy', { locale: tr })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doğurgan Dönem</span>
                <span className="font-medium">
                  {format(parseISO(prediction.fertileWindowStart), 'd MMM', { locale: tr })} - {format(parseISO(prediction.fertileWindowEnd), 'd MMM', { locale: tr })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Belirsizlik</span>
                <span className="font-medium">±{prediction.uncertainty} gün</span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button 
            onClick={handleTestNotification}
            className="h-auto py-3 flex-col gap-1"
            disabled={!hasPermission}
          >
            <Send className="w-5 h-5" />
            <span className="text-xs">Test Bildirimi</span>
          </Button>
          
          <Button 
            onClick={handleReschedule}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            disabled={isLoading || !hasPermission}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs">Yeniden Planla</span>
          </Button>
        </motion.div>

        {/* Pending Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Bekleyen Bildirimler ({pendingNotifications.length})
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={loadPendingNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <Card className="p-4 max-h-48 overflow-y-auto">
            {pendingNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Bekleyen bildirim yok
              </p>
            ) : (
              <div className="space-y-2">
                {pendingNotifications.slice(0, 10).map((notif) => (
                  <div 
                    key={notif.id}
                    className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.body}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notif.schedule?.at 
                        ? format(new Date(notif.schedule.at), 'd MMM HH:mm', { locale: tr })
                        : '-'
                      }
                    </span>
                  </div>
                ))}
                {pendingNotifications.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pendingNotifications.length - 10} daha
                  </p>
                )}
              </div>
            )}
          </Card>
          
          {pendingNotifications.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleCancelSystemOnly}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sistem Bildirimlerini Sıfırla
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex-1"
                onClick={handleCancelAll}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Tümünü İptal Et
              </Button>
            </div>
          )}
        </motion.div>

        {/* Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Loglar</h3>
          <Card className="p-4 max-h-40 overflow-y-auto bg-muted/30">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center">Log yok</p>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <p key={i} className="text-muted-foreground">{log}</p>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
