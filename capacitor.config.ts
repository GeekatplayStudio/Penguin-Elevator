import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.geekatplay.penguinelevator',
  appName: 'Penguin Elevator',
  webDir: 'dist',
  android: {
    backgroundColor: '#0b0e14',
  },
  ios: {
    backgroundColor: '#0b0e14',
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0b0e14',
      showSpinner: false,
    },
  },
};

export default config;
