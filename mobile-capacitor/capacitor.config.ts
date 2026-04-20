import type { CapacitorConfig } from '@capacitor/cli';
import path from 'path';

const config: CapacitorConfig = {
  appId: 'com.planI.app',
  appName: 'Plan-I',

  // Point Capacitor at the Vite build output in /client.
  // Run `npm run build:web` first so this folder exists and is up to date.
  webDir: path.resolve(__dirname, '..', 'client', 'dist'),

  // Allow cleartext HTTP only while using live-reload against a LAN dev server.
  // Production Render URL is HTTPS, so this flag isn't used in release builds.
  server: {
    androidScheme: 'https',
  },

  android: {
    // Leave the WebView default; the app reads its server URL from the bundled web.
  },
};

export default config;
