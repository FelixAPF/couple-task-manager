import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, filter, from, Observable, switchMap, take, throwError } from 'rxjs';
import { environment } from '../environment';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authService = inject(AuthService);
  private router = inject(Router);
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

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
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(originalRequest, token!)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    // NEW: Handle the asynchronous Capacitor Preferences call
    return from(this.authService.getRefreshToken()).pipe(
      switchMap(storedRefreshToken => {
        if (!storedRefreshToken) {
          this.isRefreshing = false;
          this.authService.logout(true);
          return EMPTY;
        }

        return this.authService.refreshToken().pipe(
          switchMap((response) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(response.token);
            return next.handle(this.addToken(originalRequest, response.token));
          }),
          catchError((refreshError) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null);
            this.authService.logout(true);
            return EMPTY;
          })
        );
      })
    );
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isAuthUrl(req.url)) {
      return next.handle(req);
    }

    const token = this.authService.getToken(); // Now pulls safely from memory!
    const authReq = token && req.url.startsWith(environment.apiUrl)
      ? this.addToken(req, token)
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(authReq, next);
        }

        if (error.status === 0) {
          console.warn('Network error — device may be offline.');
          return throwError(() => error);
        }

        if (error.status === 403 || error.status >= 500) {
          return throwError(() => error);
        }

        this.router.navigate(['/server-error']);
        return throwError(() => error);
      })
    );
  }
}