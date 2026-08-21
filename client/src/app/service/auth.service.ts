import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthRequest, RegisterRequest } from '../model/auth';
import { environment } from '../environment';
import { BehaviorSubject, Observable, Subscription, tap, from, switchMap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { HouseholdService } from './household.service';
import { PushNotificationService } from './push.notification.service';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

interface AuthResponse {
  token: string;
  refreshToken: string;
}

export const AUTH_SERVER_KEY = 'coupletasks.app.auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly baseUrl: string = `${environment.apiUrl}auth`;
  private readonly REFRESH_TOKEN_KEY = 'refreshToken'; 

  // SUPER SAFE: The access token lives ONLY in memory. 
  // It is never written to localStorage.
  private inMemoryAccessToken: string | null = null; 

  private subscription = new Subscription();
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();
  
  private router = inject(Router);

  constructor(
    private http: HttpClient, 
    private householdService: HouseholdService,
    private pushNotificationService: PushNotificationService
  ) { 
    
  }

  public attemptSilentLogin(): Observable<any> {
    return from(this.getRefreshToken()).pipe(
      switchMap(refreshToken => {
        if (refreshToken) {
          return this.refreshToken().pipe(
            catchError(() => {
              // If the refresh token is expired/invalid on boot, just log them out quietly
              this.logout(true);
              return of(null);
            })
          );
        }
        return of(null); // No token found, proceed as logged out
      })
    );
  }

  getToken(): string | null {
    return this.inMemoryAccessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.REFRESH_TOKEN_KEY });
    return value;
  }

login(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, authRequest).pipe(
      tap(async response => {
        if (response && response.token) {
          this.inMemoryAccessToken = response.token;
          
          if (response.refreshToken) {
            await Preferences.set({ key: this.REFRESH_TOKEN_KEY, value: response.refreshToken });
          }
          this.subscription.add(this.householdService.retrieveHousehold().subscribe());
          this.isLoggedInSubject.next(true);

          // NEW: Send the push token now that we have an active session!
          this.pushNotificationService.sendTokenToBackend();
        }
      })
    );
  }

  getCurrentUser(): any {
    if (!this.inMemoryAccessToken) return null;
    try {
      const payload = this.inMemoryAccessToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      let userRole = decoded.role;
      
      if (!userRole && decoded.roles && decoded.roles.length > 0) {
        userRole = decoded.roles[0].replace('ROLE_', '');
      } else if (!userRole && decoded.authorities && decoded.authorities.length > 0) {
        userRole = decoded.authorities[0].authority.replace('ROLE_', '');
      }
      
      return {
        ...decoded,
        role: userRole
      };
    } catch (e) {
      console.error('Error decoding JWT token', e);
    }
  }

refreshToken(): Observable<AuthResponse> {
    return from(this.getRefreshToken()).pipe(
      switchMap(refreshToken => {
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken });
      }),
      tap(async response => {
        if (response?.token) {
          this.inMemoryAccessToken = response.token; 
        }
        if (response?.refreshToken) {
          await Preferences.set({ key: this.REFRESH_TOKEN_KEY, value: response.refreshToken });
        }
        this.isLoggedInSubject.next(true);

        // NEW: Ensure push token is synced on app reload
        this.pushNotificationService.sendTokenToBackend();
      })
    );
  }

  register(registerRequest: RegisterRequest): Observable<RegisterRequest> {
     return this.http.post<RegisterRequest>(`${this.baseUrl}/register`, registerRequest);
  }

  async logout(expiredToken: boolean = false): Promise<void> {
    this.inMemoryAccessToken = null; // Wipe memory
    await Preferences.remove({ key: this.REFRESH_TOKEN_KEY }); // Wipe disk
    
    this.isLoggedInSubject.next(false);
    this.householdService.setHousehold(null); 
    this.router.navigate(['/login'], { queryParams: { sessionExpired: expiredToken } });
  }

  invalidateBiometricsCredentials(){
    NativeBiometric.deleteCredentials({ server: AUTH_SERVER_KEY });
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/account`);
  }
}