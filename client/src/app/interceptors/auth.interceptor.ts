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

    // URLs that must NEVER have the interceptor's error handling applied
  private readonly AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/register'];

  private isAuthUrl(url: string): boolean {
    return this.AUTH_URLS.some(authUrl => url.includes(authUrl));
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private handle401Error(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      // Queue: wait for the in-progress refresh to complete, then retry
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(originalRequest, token!)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const storedRefreshToken = this.authService.getRefreshToken();

    if (!storedRefreshToken) {
      this.isRefreshing = false;
      this.authService.logout(true);
      return EMPTY;
    }

    return this.authService.refreshToken().pipe(
      switchMap((response) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(response.token);
        // Retry the original request with the new access token
        return next.handle(this.addToken(originalRequest, response.token));
      }),
      catchError((refreshError) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);
        // Refresh token itself is expired or invalid — must login again
        this.authService.logout(true);
        return EMPTY;
      })
    );
  }

 intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Never intercept auth endpoints — avoids infinite loops
    if (this.isAuthUrl(req.url)) {
      return next.handle(req);
    }

    // Add access token if we have one
    const token = this.authService.getToken();
    const authReq = token && req.url.startsWith(environment.apiUrl)
      ? this.addToken(req, token)
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(authReq, next);
        }

        // Network error (offline, app resume from background) — never logout for this
        if (error.status === 0) {
          console.warn('Network error — device may be offline.');
          return throwError(() => error);
        }

        if (error.status === 403) {
          return throwError(() => error);
        }

        if (error.status >= 500) {
          return throwError(() => error);
        }

        this.router.navigate(['/server-error']);
        return throwError(() => error);
      })
    );
  }
}