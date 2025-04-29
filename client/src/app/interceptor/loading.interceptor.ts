// src/app/interceptors/loading.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { LoadingService } from '../service/loading/loading.service'; // Adjust path if needed

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  private activeRequests = 0;
  private loadingService = inject(LoadingService);

  intercept(request: HttpRequest<any>, next: any): Observable<HttpEvent<any>> {
    this.loadingService.setLoading(true, request.url);
    console.log("Intercepting request: ", request.url);
    return next.handle(request)
      .pipe(catchError((err) => {
        this.loadingService.setLoading(false, request.url);
        return throwError(() => err);
      }))
      .pipe(map<HttpEvent<any>, any>((evt: HttpEvent<any>) => {
        if (evt instanceof HttpResponse) {
          this.loadingService.setLoading(false, request.url);
        }
        return evt;
      }));
  }
}
