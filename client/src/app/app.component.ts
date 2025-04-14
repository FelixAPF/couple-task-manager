import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TaskService } from './service/task-service.service';
import { SharedModule } from "../app/shared.module"
import { NavbarComponent } from './header/navbar/navbar.component';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { FooterNavbarComponent } from './footer-navbar/footer-navbar.component';
import { StatusBar, StatusBarStyle, Style } from '@capacitor/status-bar';
import { AppUpdate, AppUpdateInfo } from '@capawesome/capacitor-app-update';
import { Platform } from '@angular/cdk/platform';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';
import { PluginListenerHandle } from '@capacitor/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { routeAnimations } from './animations';
import { VersionControlService } from './service/version-control.service';
import { Subscription } from 'rxjs';
import * as BackEndVersion from "../../version.json";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SharedModule, NavbarComponent, FooterNavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [routeAnimations],
})
export class AppComponent implements OnInit, OnDestroy {
  public appUpdateInfo: AppUpdateInfo | undefined;

  title = 'client';
  swipeTransform = 'translateX(0)';

  isMobile = false;
  subscription: Subscription = new Subscription();
  outdatedVersion: boolean = false;
  

  constructor(private translate: TranslateService, private primeng: PrimeNG, private router: Router,  private location: Location, private platform: Platform,
  private dialogService: DialogService, private zone: NgZone, private versionService: VersionControlService) {
    translate.setDefaultLang('fr');
    translate.addLangs(['fr', 'en']);
    translate.use('fr');
    this.primeng.ripple.set(true);
  }

  get platformName(){
    return this.platform;
  }

  backButtonListener: PluginListenerHandle; 

  public async openAppStore(): Promise<void> {
    await AppUpdate.openAppStore();
  }

  async ngOnInit() {
    this.performImmediateUpdate();
    this.checkScreenWidth();
    this.setupBackButtonListener(); // Call helper function
    this.subscription.add(this.versionService.retrieveVersion().subscribe((version) => {
      if(version.toString() !== BackEndVersion.version.toString()) {
        this.openAppStore();
      }
    }));
  }

  async setupBackButtonListener(): Promise<void> {
    if (!this.platform.ANDROID) return;
    try {
      this.backButtonListener = await App.addListener('backButton', () => {
        this.zone.run(() => {
          if (this.dialogService.dialogComponentRefMap && this.dialogService.dialogComponentRefMap.size > 0) {
            const dialogRefsArray = Array.from(this.dialogService.dialogComponentRefMap.keys());
            const topmostDialogRef = dialogRefsArray[dialogRefsArray.length - 1];

            // Safety check and close
            if (topmostDialogRef && typeof topmostDialogRef.close === 'function') {
              topmostDialogRef.close();
            } else {
                console.warn('Back button: Could not find close method on topmost dialog ref.');
            }
          }
          // --- If no dialogs are open (or closing failed), proceed with navigation/exit ---
          else if (this.router.url === '/dashboard') {
            App.exitApp();
          } else {
            this.location.back();
          }
        });
      });
    } catch (error) {
      console.error('Error adding back button listener:', error);
    }
  }

  prepareRoute(outlet: RouterOutlet) {
    // Use the component reference string as the animation state.
    // This ensures the value changes whenever the activated component changes.
    return outlet && outlet.isActivated && outlet.activatedRoute && outlet.activatedRoute.snapshot && outlet.activatedRoute.snapshot.url.join('/');
  }

  ngOnDestroy(): void {
    if (this.backButtonListener) {
      this.backButtonListener.remove();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  ionViewWillEnter() {
  }

  checkScreenWidth() {
    this.isMobile = window.innerWidth < 640; // Tailwind 'sm' breakpoint (640px)
  }
  swipeNavigation(event: any) {
    if (this.isMobile) {
      const currentRoute = this.router.url;
      if (event.direction === 2) { // Swipe left
        this.swipeTransform = 'translateX(-30%)'; // Reduced translation
        setTimeout(() => {
          if (currentRoute === '/dashboard') {
            this.router.navigate(['/tasks']);
          } else if (currentRoute === '/tasks') {
            this.router.navigate(['/split']);
          } else if(currentRoute === '/split'){
            this.router.navigate(['/shopping-list']);
          }
          this.swipeTransform = 'translateX(0)';
        }, 200); // Reduced delay
      } else if (event.direction === 4) { // Swipe right
        this.swipeTransform = 'translateX(30%)'; // Reduced translation
        setTimeout(() => {
          if (currentRoute === '/tasks') {
            this.router.navigate(['/dashboard']);
          } else if (currentRoute === '/split') {
            this.router.navigate(['/tasks']);
          }  else if(currentRoute === '/shopping-list'){
            this.router.navigate(['/split']);
          }
          this.swipeTransform = 'translateX(0)';
        }, 200); // Reduced delay
      }
    }
  }

  public async performImmediateUpdate(): Promise<void> {
    await AppUpdate.performImmediateUpdate();
  }
}
