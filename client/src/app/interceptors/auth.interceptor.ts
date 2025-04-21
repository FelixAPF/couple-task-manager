import { HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { AuthService } from '../service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // 1. Get the token from AuthService
    const authToken = this.authService.getToken();

    // 2. Check if the request is going to your API URL and if a token exists
    if (authToken && req.url.startsWith(environment.apiUrl)) {
      // 3. Clone the request to add the new header.
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}` // Standard Bearer token format
        }
      });
      // 4. Pass the cloned request instead of the original request to the next handle
      return next.handle(authReq);
    } else {
      // 5. If no token or not an API request, pass the original request without modification
      return next.handle(req);
    }
  }
}