import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: ' cpr-app',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
