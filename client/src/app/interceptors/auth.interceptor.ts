import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, throwError } from 'rxjs';
import { environment } from '../environment';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authService = inject(AuthService);
  private router = inject(Router);


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
          console.warn('AuthInterceptor: Received 401 Unauthorized. Logging out.');
          // Perform logout actions via AuthService
          this.authService.logout(true);

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
        }  else if(error.status >= 500) {
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
