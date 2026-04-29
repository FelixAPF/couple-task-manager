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
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  private addTokenHeader(request: HttpRequest<any>, token: string | null): HttpRequest<any> {
    if (token && request.url.startsWith(environment.apiUrl)) {
      return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return request;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null); // Block other requests while refreshing

      const refreshToken = this.authService.getRefreshToken();

      // If there's no refresh token at all, logout immediately
      if (!refreshToken) {
        this.isRefreshing = false;
        this.authService.logout(true);
        return EMPTY;
      }

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.token); // Unblock queued requests
          return next.handle(this.addTokenHeader(request, response.token));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          // Only logout if the refresh itself failed (expired refresh token)
          this.authService.logout(true);
          return EMPTY;
        })
      );
    } else {
      // Queue this request — wait until refresh completes, then retry with new token
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addTokenHeader(request, token)))
      );
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth endpoints to avoid infinite loops
    if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh') || req.url.includes('/auth/register')) {
      return next.handle(req);
    }

    const authToken = this.authService.getToken();
    let authReq = req;

    if (authToken && req.url.startsWith(environment.apiUrl)) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${authToken}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(authReq, next);
        } else if (error.status === 0) {
          // Network error (offline/app resume) — don't logout
          console.warn('Network error — device may be offline.');
          return throwError(() => error);
        } else if (error.status >= 500) {
          return throwError(() => error);
        } else if (error.status === 403) {
          return throwError(() => error);
        } else {
          this.router.navigate(['/server-error']);
          return throwError(() => error);
        }
      })
    );
  }
}
