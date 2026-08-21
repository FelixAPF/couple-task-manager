import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { InMemoryScrollingFeature, InMemoryScrollingOptions, provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import {TranslateModule, TranslateLoader} from "@ngx-translate/core";
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import localeFrCa from '@angular/common/locales/fr-CA';


import { routes } from './app.routes';
import * as Hammer from 'hammerjs';


import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { registerLocaleData } from '@angular/common';
import localeFrCA from '@angular/common/locales/fr-CA'; // <-- Import locale data
import { LoadingInterceptor } from './interceptor/loading.interceptor';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from './service/auth.service';

registerLocaleData(localeFrCA, 'fr-CA'); // <-- Register with the correct ID 'fr-CA'


const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) =>
  new TranslateHttpLoader(http, './i18n/', '.json');

export class MyHammerConfig extends HammerGestureConfig {
  override overrides = <any> {
    'swipe':  {
       direction: Hammer.DIRECTION_ALL, // Keep detecting all directions
       touchAction: 'pan-y' // *** ADD THIS LINE: Allow vertical scrolling ***
    },
  }
}

export function initializeAuth(authService: AuthService) {
  return () => authService.attemptSilentLogin();
}

const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
};

const inMemoryScrollingFeature: InMemoryScrollingFeature =
  withInMemoryScrolling(scrollConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, inMemoryScrollingFeature),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    ConfirmationService,
    MessageService,
    DialogService,
    { provide: LOCALE_ID, useValue: 'fr-CA' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    },

    providePrimeNG({
      theme: {
          preset: Aura,
          options: {
              prefix: 'p',
              darkModeSelector: 'system',
              cssLayer: false
          }
      }
  }),
    importProvidersFrom([TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }), HammerModule]),
    { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true, // Required because multiple interceptors can exist
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true, // Required because multiple interceptors can exist
    }
  ]
};
