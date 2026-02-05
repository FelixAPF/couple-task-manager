import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environment';
import { AppNotification } from '../model/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl.endsWith('/') 
    ? `${environment.apiUrl}notifications` 
    : `${environment.apiUrl}/notifications`;

  // Reactive state for the badge count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) { 
    this.refreshUnreadCount();
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