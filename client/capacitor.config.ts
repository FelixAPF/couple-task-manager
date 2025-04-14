import type { CapacitorConfig } from '@capacitor/cli';
import { Style } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'com.couple.taskmanager',
  appName: 'couple-task-manager',
  webDir: 'dist/client/browser',
  plugins: {
    StatusBar: {
      style: Style.Light,
      backgroundColor: '#000000'
    }
  }
};

export default config;
