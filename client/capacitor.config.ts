import type { CapacitorConfig } from '@capacitor/cli';
import { Style } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'com.couple.taskmanager',
  appName: 'couple-task-manager',
  webDir: 'dist/client/browser',
  server: {    
    androidScheme: 'https',    
    iosScheme: 'https',    
    hostname: 'coupletaskmanager.com'
  },
    // REMPLACEZ ICI par le domaine que vous utilisez en production  },

  plugins: {
    StatusBar: {
      style: Style.Light,
      backgroundColor: '#000000'
    }
  }
};

export default config;
