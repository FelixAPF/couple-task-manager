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
      console.log('Push Token Received:', token.value);
      this.fcmToken = token.value; // Always cache it!
      
      // NEW: Only send automatically on app load if an auth token already exists
      if (localStorage.getItem('authToken')) {
         this.sendTokenToBackend(); 
      }
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error: ', err.error);
    });
  }

  // Call this method AFTER login
  public sendTokenToBackend() {
    if (this.fcmToken) {
      console.log('Sending cached token to backend...');
      // Ensure the string is sent as a simple string or JSON depending on your backend
      // Based on your Controller: public ResponseEntity<Void> registerToken(@RequestBody String token)
      // You might need to send it as a raw string or wrapper object. 
      // Let's assume raw string for now based on your previous code.
      this.http.post(`${environment.apiUrl}api/notifications/token`, this.fcmToken).subscribe({
        next: () => console.log('Token sent to backend successfully'),
        error: (err) => console.error('Failed to send token (likely not logged in):', err)
      });
    }
  }
}