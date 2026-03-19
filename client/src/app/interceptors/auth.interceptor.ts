import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, filter, Observable, switchMap, take, throwError } from 'rxjs';
import { environment } from '../environment';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authService = inject(AuthService);
  private router = inject(Router);
  private isRefreshing = false;
  // Used to queue up API calls that happen while the token is refreshing
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);


  private addTokenHeader(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (token && request.url.startsWith(environment.apiUrl)) {
      return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return request;
  }

  // Handles the silent refresh logic
  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          // Notify queued requests that the new token is ready
          this.refreshTokenSubject.next(token.token);
          // Retry the original failed request
          return next.handle(this.addTokenHeader(request, token.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // If the refresh token is also expired or invalid, THEN force a logout
          this.authService.logout(true);
          return throwError(() => err);
        })
      );
    } else {
      // If a refresh is already happening, queue this request until the token is updated
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(this.addTokenHeader(request, jwt));
        })
      );
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const authToken = this.authService.getToken();

    let authReq = req; // Start with original request

    // Clone request to add token if applicable
    if (authToken && req.url.startsWith(environment.apiUrl)) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }

    // Pass the request and handle potential errors in the response stream
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Check if it's a 401 Unauthorized or 403 Forbidden error
        // Often 401 is for authentication (no/invalid token), 403 for authorization (valid token, no permission)
        // BUT sometimes backends use 401/403 interchangeably for expired tokens.
        // We'll trigger logout on 401 primarily, as it's the standard for auth failure.
        if (error.status === 401) {
          if (error.status === 401 && !req.url.includes('/auth/login')) {
            return this.handle401Error(authReq, next);
          }
          // Prevent the error from propagating to the component's error handler
          // because we've handled it by logging out. Return EMPTY observable.
          return EMPTY; // Or: return throwError(() => new Error('Session expired')); if you want to signal differently

        } else if (error.status === 403) {
           // Decide if 403 should also trigger logout. Sometimes it means forbidden access even with a valid token.
           // If your backend ONLY uses 403 for expired tokens, uncomment the logout below.
           // If 403 means the user IS logged in but lacks permission for THIS specific action, DO NOT logout here.
           // Uncomment the next line ONLY if 403 specifically means expired session in your backend
           // this.authService.logout();
           // return EMPTY; // Uncomment if logging out on 403

           // If 403 means lack of permission, re-throw the error for component handling
           return throwError(() => error);
        } else if (error.status === 0) {
            // NOUVEAU: Handle status 0 (Offline / Network dropping on app resume)
            // We just pass the error along so the component fails silently or shows a toast,
            // rather than destroying the user's session by navigating away.
            console.warn('Network error: Device might be offline or waking up.');
            return throwError(() => error);
        } else if(error.status >= 500) {
            return throwError(() => error);

        } else {
          // For all other errors (404, 500, etc.), re-throw them
          // so they can be handled by the component's error callback.
          this.router.navigate(['/server-error']); // Navigate to your new component
          return throwError(() => error);
        }
      })
    );
  }
}
