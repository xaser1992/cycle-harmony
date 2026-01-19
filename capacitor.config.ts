import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.58d2f5b27d6a4b6ca11661bf81689909',
  appName: 'Döngü Takibi',
  webDir: 'dist',
  // Production build - uses local files
  // For development with hot reload, uncomment below:
  // server: {
  //   url: 'https://58d2f5b2-7d6a-4b6c-a116-61bf81689909.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#E57B9D',
      sound: 'notification.wav',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FDB5B5',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
