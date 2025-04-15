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
  acknowledgeUpdate: boolean = false;
  

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
      if(parseFloat(BackEndVersion.version).toFixed(4) !== parseFloat(version).toFixed(4)) {
        console.log(parseFloat(BackEndVersion.version).toFixed(4), parseFloat(version).toFixed(4))
        this.outdatedVersion = true;
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

            if (topmostDialogRef && typeof topmostDialogRef.close === 'function') {
              topmostDialogRef.close();
            } else {
                console.warn('Back button: Could not find close method on topmost dialog ref.');
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
      console.error('Error adding back button listener:', error);
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

  public async performImmediateUpdate(): Promise<void> {
    await AppUpdate.performImmediateUpdate();
  }
}
