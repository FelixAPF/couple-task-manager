import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from '@capacitor/push-notifications';
import { environment } from "../environment";


@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  
  // Store the token locally so we can send it later if needed
  private fcmToken: string | null = null;

  constructor(private http: HttpClient) {}

  public initPush() {
    if (Capacitor.isNativePlatform()) {
      this.addListeners();
      this.register();
    }
  }

private async register() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      // Explicitly create the channel for modern Android OS to ensure delivery
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Default Notifications',
        description: 'General app notifications',
        importance: 5, // 5 = HIGH importance (wakes screen)
        visibility: 1, // 1 = VISIBLE on lock screen
        vibration: true
      });

      await PushNotifications.register();
    }
  }

private addListeners() {
    PushNotifications.addListener('registration', token => {
      console.log('Push Token Received from OS:', token.value);
      
      // 1. Save it to local storage so it survives app restarts before login
      localStorage.setItem('pending_fcm_token', token.value);
      this.fcmToken = token.value; 

      // 2. ONLY send it now if they are ALREADY logged in (app reload scenario)
      if (localStorage.getItem('authToken')) {
         this.sendTokenToBackend(); 
      }
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error: ', err.error);
    });
  }
public sendTokenToBackend() {
  const tokenToSend = this.fcmToken || localStorage.getItem('pending_fcm_token');
  const authToken = localStorage.getItem('authToken');

  console.log('sendTokenToBackend called:', { 
    hasFcmToken: !!this.fcmToken, 
    hasPendingToken: !!localStorage.getItem('pending_fcm_token'),
    hasAuthToken: !!authToken,
    tokenToSend: tokenToSend?.substring(0, 20) + '...'
  });

  if (!tokenToSend) {
    console.warn('No FCM token available yet — will retry after registration');
    return;
  }

  if (!authToken) {
    console.warn('No auth token — FCM token stored in pending, will send after login');
    return;
  }

  this.http.post(`${environment.apiUrl}notifications/token`, tokenToSend).subscribe({
    next: () => {
      console.log('✅ FCM token saved to backend');
      localStorage.removeItem('pending_fcm_token');
    },
    error: (err) => console.error('❌ Failed to send FCM token:', err.status, err.message)
  });
}
}