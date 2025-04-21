import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthRequest, RegisterRequest } from '../model/auth';
import { environment } from '../environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly baseUrl: string = `${environment.apiUrl}auth`;
  private readonly TOKEN_KEY = 'authToken'; // Key for localStorage

  // Use BehaviorSubject to hold the current login state
  // Initialize based on token presence during construction
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  // Expose the login state as an observable
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  private router = inject(Router); // Inject Router

  constructor(private http: HttpClient) { }

  // Helper to check if a token exists in localStorage
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  // Method to get the current token (useful for interceptors)
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(authRequest: AuthRequest): Observable<AuthResponse> { // Expect AuthResponse object
    // Remove responseType: 'text', let Angular parse JSON by default
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, authRequest)
      .pipe(
        tap(response => { // The response is now the parsed AuthResponse object
          if (response && response.token) {
            // Store ONLY the token string from the response object
            localStorage.setItem(this.TOKEN_KEY, response.token);
            // Update the login state
            this.isLoggedInSubject.next(true);
          } else {
            console.error('AuthService: Invalid login response structure.', response);
            this.isLoggedInSubject.next(false);
          }
        })
      );
  }

  register(registerRequest: RegisterRequest): Observable<RegisterRequest> { 
    return this.http.post<RegisterRequest>(`${this.baseUrl}/register`, registerRequest);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }
}