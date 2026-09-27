import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.limelizardgames.wordsmithtavern',
  appName: 'Wordsmith Tavern',
  webDir: 'dist',
  backgroundColor: '#1d120b',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1d120b',
      showSpinner: false,
    },
  },
  android: {
    backgroundColor: '#1d120b',
  },
  ios: {
    backgroundColor: '#1d120b',
    contentInset: 'never',
  },
};

export default config;
