// 🌸 Debug Panel - Performance Optimized (No framer-motion)
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  RefreshCw, 
  Send, 
  CheckCircle, 
  XCircle,
  Clock,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useCycleData } from '@/hooks/useCycleData';
import { 
  checkNotificationPermissions, 
  requestNotificationPermissions,
  sendTestNotification,
  getPendingNotifications,
  scheduleNotifications,
  cancelAllNotifications
} from '@/lib/notifications';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { LocalNotificationSchema } from '@capacitor/local-notifications';

export default function DebugPage() {
  const navigate = useNavigate();
  const { prediction, notificationPrefs, userSettings, cycleSettings } = useCycleData();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState<LocalNotificationSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${format(new Date(), 'HH:mm:ss')}] ${message}`]);
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
  };

  const loadPendingNotifications = async () => {
    setIsLoading(true);
    addLog('Loading pending notifications...');
    try {
      const pending = await getPendingNotifications();
      setPendingNotifications(pending);
      addLog(`Found ${pending.length} pending notifications`);
    } catch (error) {
      addLog(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleTestNotification = async () => {
    addLog('Sending test notification...');
    try {
      await sendTestNotification(userSettings.language);
      addLog('✓ Test notification sent');
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
  };

  const handleReschedule = async () => {
    if (!prediction) {
      addLog('✗ No prediction available');
      return;
    }
    
    setIsLoading(true);
    addLog('Rescheduling all notifications...');
    try {
      await scheduleNotifications(prediction, notificationPrefs, userSettings.language);
      addLog('✓ Notifications rescheduled');
      await loadPendingNotifications();
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
    setIsLoading(false);
  };

  const handleCancelAll = async () => {
    addLog('Cancelling all notifications...');
    try {
      await cancelAllNotifications();
      addLog('✓ All notifications cancelled');
      await loadPendingNotifications();
    } catch (error) {
      addLog(`✗ Error: ${error}`);
    }
  };

  useEffect(() => {
    checkPermissions();
    loadPendingNotifications();
  }, []);

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
        <div className="animate-fade-in">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sistem Durumu</h3>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Bildirim İzni</span>
              </div>
              {hasPermission === null ? (
                <span className="text-sm text-muted-foreground">Kontrol ediliyor...</span>
              ) : hasPermission ? (
                <div className="flex items-center gap-1 text-green-600">
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
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Tercih Edilen Saat</span>
              </div>
              <span className="text-sm font-medium">{notificationPrefs.preferredTime}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Saat Dilimi</span>
              </div>
              <span className="text-sm font-medium">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
          </Card>
        </div>

        {/* Predictions */}
        {prediction && (
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
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
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
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
        </div>

        {/* Pending Notifications */}
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
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
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full mt-2"
              onClick={handleCancelAll}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Tümünü İptal Et
            </Button>
          )}
        </div>

        {/* Logs */}
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
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
        </div>
      </main>
    </div>
  );
}
