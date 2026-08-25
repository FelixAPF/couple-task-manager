import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, Observable, tap } from 'rxjs';
import { environment } from '../environment';
import { AppNotification } from '../model/notification';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl.endsWith('/') 
    ? `${environment.apiUrl}notifications` 
    : `${environment.apiUrl}/notifications`;

  // Reactive state for the badge count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();
constructor() { 
    // Only fetch unread count once the user is confirmed logged in
    this.authService.isLoggedIn$.pipe(
      filter(isLoggedIn => isLoggedIn)
    ).subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  getNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0)) // Reset local badge immediately
    );
  }

  refreshUnreadCount() {
    this.getUnreadCount().subscribe(count => {
      this.unreadCountSubject.next(count);
    });
  }
}