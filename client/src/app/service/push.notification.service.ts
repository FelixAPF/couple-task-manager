import { HttpClient } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from '@capacitor/push-notifications';
import { environment } from "../environment";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private fcmToken: string | null = null;

  // Use Injector to get AuthService dynamically to avoid Circular Dependency
  constructor(private http: HttpClient, private injector: Injector) {}

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
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Default Notifications',
        description: 'General app notifications',
        importance: 5,
        visibility: 1,
        vibration: true
      });
      await PushNotifications.register();
    }
  }

  private addListeners() {
    PushNotifications.addListener('registration', token => {
      console.log('Push Token Received from OS:', token.value);
      localStorage.setItem('pending_fcm_token', token.value);
      this.fcmToken = token.value; 

      // Check the memory token securely
      const authService = this.injector.get(AuthService);
      if (authService.getToken()) {
         this.sendTokenToBackend(); 
      }
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error: ', err.error);
    });
  }

  public sendTokenToBackend() {
    const tokenToSend = this.fcmToken || localStorage.getItem('pending_fcm_token');
    
    // Dynamically grab AuthService
    const authService = this.injector.get(AuthService);
    const authToken = authService.getToken();

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