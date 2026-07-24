import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoadingService } from '../service/loading/loading.service'; 
import { ShoppingService } from '../service/shopping.service';
import { RecipeService } from '../service/recipe.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  private loadingService = inject(LoadingService);
  
  excludedLoadEndpoints: string[] =  [ 
    ShoppingService.shoppingListSuggestionsEndPoint(), 
    ShoppingService.shoppingListUpdateQuantityEndpoint(), 
    RecipeService.randomRecipeEndpoint(), 
    '/travel',
    '/finance'
  ];

  intercept(request: HttpRequest<any>, next: any): Observable<HttpEvent<any>> {
    if(this.excludedLoadEndpoints.includes(request.url) || 
       this.excludedLoadEndpoints.some((endpoint) => request.url.startsWith(endpoint)) || 
       request.url.includes('travel') || 
       request.url.includes('finance') || 
       request.url.includes('notifications/unread-count')) { 
      
      return next.handle(request);
    }

    this.loadingService.setLoading(true, request.url);
    
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