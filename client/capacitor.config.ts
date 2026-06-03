import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaoyan.yanci',
  appName: '研词',
  webDir: 'dist',
  server: {
    // HashRouter fix: tell Capacitor to load the app root
    // iOS: starts from '/' instead of the file path
    iosScheme: 'yanci',
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    // Allow scrolling behind status bar for immersive feel
    scrollEnabled: true,
  },
  android: {
    // Allow mixed content for dev API connections
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2563EB',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
