import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthRequest, RegisterRequest } from '../model/auth';
import { environment } from '../environment';
import { BehaviorSubject, Observable, Subscription, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HouseholdService } from './household.service';

interface AuthResponse {
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly baseUrl: string = `${environment.apiUrl}auth`;
  private readonly TOKEN_KEY = 'authToken'; // Key for localStorage
  private readonly REFRESH_TOKEN_KEY = 'refreshToken'; 
  private subscription = new Subscription(); // Subscription to manage observables

  // Use BehaviorSubject to hold the current login state
  // Initialize based on token presence during construction
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  // Expose the login state as an observable
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  private router = inject(Router); // Inject Router

  constructor(private http: HttpClient, private householdService: HouseholdService) { }

  // Helper to check if a token exists in localStorage
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // Method to get the current token (useful for interceptors)
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

login(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, authRequest).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          // Store the refresh token securely
          if (response.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
          }
          
          this.subscription.add(this.householdService.retrieveHousehold().subscribe());
          this.isLoggedInSubject.next(true);
        } else {
          this.isLoggedInSubject.next(false);
        }
      })
    );
  }

refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
      tap((response: AuthResponse) => {
        // On sauvegarde le nouvel Access Token
        localStorage.setItem(this.TOKEN_KEY, response.token);
        
        // NOUVEAU : On sauvegarde le nouveau Refresh Token s'il est fourni
        if (response.refreshToken) {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        }
        
        this.isLoggedInSubject.next(true);
      })
    );
  }

  register(registerRequest: RegisterRequest): Observable<RegisterRequest> { 
    return this.http.post<RegisterRequest>(`${this.baseUrl}/register`, registerRequest);
  }

  logout(expiredToken: boolean = false): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.isLoggedInSubject.next(false);
    this.householdService.setHousehold(null); // Clear household data on logout
    this.router.navigate(['/login'], { queryParams: { sessionExpired: expiredToken } });
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/account`);
  }
}