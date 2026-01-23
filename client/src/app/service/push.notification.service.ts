import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from '@capacitor/push-notifications';
import { environment } from "../environment";


@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  
  constructor(private http: HttpClient) {}

  public initPush() {
    // Only run on native devices (Android/iOS)
    const isPushNotificationsAvailable = Capacitor.isNativePlatform();

    if (isPushNotificationsAvailable) {
      this.register();
      this.addListeners();
    }
  }

  private async register() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.error('User denied permissions!');
      return;
    }

    await PushNotifications.register();
  }

  private addListeners() {
    PushNotifications.addListener('registration', token => {
      // Send token to backend
      this.http.post(`${environment.apiUrl}/api/notifications/token`, token.value).subscribe();
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('Registration error: ', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push received: ', notification);
    });
  }
}