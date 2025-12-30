import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoadingService } from './service/loading/loading.service';
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
import { asyncScheduler, delay, observeOn, Subscription } from 'rxjs';
import * as BackEndVersion from "../../version.json";
import { HouseholdService } from './service/household.service';


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
  isLoading = true;
  subscription: Subscription = new Subscription();
  outdatedVersion: boolean = false;
  acknowledgeUpdate: boolean = false;
  showUpdateDialog: boolean = false;
  

  constructor(private translate: TranslateService, private loadingService: LoadingService, private primeng: PrimeNG, private router: Router,  private location: Location, private platform: Platform,
  private dialogService: DialogService, private zone: NgZone, private versionService: VersionControlService, private householdService: HouseholdService) {
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
    this.showUpdateDialog = false; // Close dialog on action
  }

  ngOnInit() {
    this.checkScreenWidth();
    this.setupBackButtonListener(); // Call helper function
    this.subscription.add(this.versionService.retrieveVersion().subscribe((version) => {
      if(!this.platform.ANDROID) return;
      if(parseFloat(BackEndVersion.version).toFixed(4) !== parseFloat(version).toFixed(4)) {
        this.outdatedVersion = true;
        this.showUpdateDialog = true; // <--- Trigger the popup here
      }
    }));

    if(this.platform.ANDROID) {
      this.setStatusBarBackgroundColor();
      this.setStatusBarStyle();
    }

    this.subscription.add(this.householdService.retrieveHousehold().subscribe((household) => {
      this.householdService.setHousehold(household);
    }));

    this.subscription.add(this.loadingService.loadingSub
      .pipe(
        observeOn(asyncScheduler) // <--- Add this pipe with observeOn
      )
      .subscribe((state) => {
        this.isLoading = state; // Assign the state after async scheduling
      })
    );

    const language = localStorage.getItem('language');
    if (language) {
      this.translate.use(language);
    } else {
      localStorage.setItem('language', 'fr');
      this.translate.use('fr');
    }
  }

  async setupBackButtonListener(): Promise<void> {
    if (!this.platform.ANDROID) return;
    try {
      this.backButtonListener = await App.addListener('backButton', () => {
        this.zone.run(() => {
          if (this.dialogService.dialogComponentRefMap && this.dialogService.dialogComponentRefMap.size > 0) {
            const dialogRefsArray = Array.from(this.dialogService.dialogComponentRefMap.keys());
            const topmostDialogRef = dialogRefsArray[dialogRefsArray.length - 1];

            if (topmostDialogRef && typeof topmostDialogRef.close === 'function') {
              topmostDialogRef.close();
            }
          }
          else if (this.router.url === '/dashboard') {
            App.exitApp();
          } else {
            this.location.back();
          }
        });
      });
    } catch (error) {
    }
  }

  prepareRoute(outlet: RouterOutlet) {
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
  
  public closeUpdateDialog(): void {
    this.acknowledgeUpdate = true;
  }

  async setStatusBarStyle() {
    // You can choose between Default, Light, or Dark style for the text/icons
    await StatusBar.setStyle({ style: Style.Default }); // Or Style.Light for dark backgrounds
    await StatusBar.setOverlaysWebView({ overlay: false }); // Prevent overlay

  }

  async setStatusBarBackgroundColor() {
    // Set your desired background color here (hexadecimal or CSS color name)
    await StatusBar.setBackgroundColor({ color: '#f0f0f0' }); // Example: Light gray
    
  }
  
}
