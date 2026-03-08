import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ritmoup.app',
  appName: 'RitmoUp',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    },
    StatusBar: {
      overlaysWebView: true,
    }
  }
};

export default config;
