import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.poollegends.game',
  appName: 'Pool Legends 3D',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#020617',
    allowsLinkPreview: false,
    scrollEnabled: false,
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
    webContentsDebuggingEnabled: false,
  },
};

export default config;
