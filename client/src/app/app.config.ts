import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { InMemoryScrollingFeature, InMemoryScrollingOptions, provideRouter, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import {TranslateModule, TranslateLoader} from "@ngx-translate/core";
import {TranslateHttpLoader} from '@ngx-translate/http-loader';


import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HammerGestureConfig, HammerModule } from '@angular/platform-browser';
import { DialogService } from 'primeng/dynamicdialog';

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (http: HttpClient) =>
  new TranslateHttpLoader(http, './i18n/', '.json');

export class MyHammerConfig extends HammerGestureConfig {
  override overrides = <any> {
    'swipe': { direction: Hammer.DIRECTION_RIGHT | Hammer.DIRECTION_LEFT },
  }
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
    DialogService,
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
  {
    provide: HammerModule,
    useValue: MyHammerConfig,
  },
    importProvidersFrom([TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }), HammerModule]),
  ]
};
