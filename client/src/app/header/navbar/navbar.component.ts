import { Component, ElementRef, HostListener, inject, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from '../../service/auth.service';
import { HouseholdService } from '../../service/household.service';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { JoinHouseholdComponent } from '../../household/join-household/join-household.component';
import { filter, interval, Observable, Subscription, switchMap } from 'rxjs';
import { Household, HouseholdMember, UserRole } from '../../model/household';
import { AppNotification } from '../../model/notification';
import { NotificationService } from '../../service/notification.service';
import { UiStateService } from '../../service/ui-state.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SharedModule, CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  providers: [MessageService]
})
export class NavbarComponent implements OnInit {
  @ViewChild('notificationContainer') notificationContainerRef!: ElementRef;

  isMenuOpen = false;
  nextBackgroundTheme = Style.Dark;

  private authService = inject(AuthService);
  private householdService = inject(HouseholdService);
  private dialogService = inject(DialogService);
  private notificationService = inject(NotificationService);
  private uiState = inject(UiStateService);

  USER_ROLE = UserRole;
  showNotifications = false;
  notifications: AppNotification[] = [];
  unreadCount$: Observable<number> = this.notificationService.unreadCount$;
  isLoggedIn$ = this.authService.isLoggedIn$;
  household$ = this.householdService.household$;
  currentUser$: Observable<HouseholdMember | null> = this.householdService.currentUser$;
  subscription: Subscription = new Subscription();
  household: Household | null = null;

  constructor(
    private router: Router, 
    public translate: TranslateService, 
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
  // 1. Periodically check notifications when logged in
  this.subscription.add(
    interval(60000).pipe(
      switchMap(() => this.authService.isLoggedIn$),
      filter(isLoggedIn => isLoggedIn)
    ).subscribe(() => {
      this.notificationService.refreshUnreadCount();
    })
  );

  // 2. Listen to the household reactive subject directly (no premature HTTP call)
  this.subscription.add(
    this.householdService.household$.subscribe((household) => {
      this.household = household;
    })
  );
}

  useLanguage(language: string): void {
    this.translate.use(language);
    localStorage.setItem('language', language);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    this.uiState.setMobileMenuOpen(this.isMenuOpen);
  }

  logout(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
    this.uiState.setMobileMenuOpen(false);
    this.authService.logout();
    this.authService.invalidateBiometricsCredentials();
  }

  onCopySuccess(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Copié',
      detail: 'Code de foyer copié dans le presse-papiers!',
      life: 2000
    });
  }

  openJoinHouseholdDialog(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
    this.uiState.setMobileMenuOpen(false);
    const joinDialogRef = this.dialogService.open(JoinHouseholdComponent, {
      header: 'Rejoindre un foyer existant',
      width: '90%',
      modal: true,
      dismissableMask: true,
      contentStyle: { "overflow": "auto" },
      baseZIndex: 10000
    });

    joinDialogRef.onClose.subscribe(() => {});
  }

  // --- Notification Center Methods ---
  toggleNotifications(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.notificationService.getNotifications().subscribe(data => {
        this.notifications = data;
      });
      this.notificationService.markAllAsRead().subscribe();
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  handleNotificationClick(notification: AppNotification): void {
    this.showNotifications = false;
    if (notification.type === 'LETTER' && notification.referenceId) {
      this.router.navigate(['/letters/view', notification.referenceId]);
    } else if (notification.type === 'TASK') {
      this.router.navigate(['/tasks']);
    } else if (notification.type === 'MEAL') {
      this.router.navigate(['/meals']);
    } else if (notification.type === 'FINANCE') {
      this.router.navigate(['/finance/dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Closes notifications whenever clicking anywhere outside the container
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showNotifications && this.notificationContainerRef) {
      const clickedInside = this.notificationContainerRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.showNotifications = false;
      }
    }
  }

  // Closes notifications on Escape key
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showNotifications = false;
    if (this.isMenuOpen) {
      this.toggleMenu();
    }
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user && user.role === 'ADMIN';
  }
}