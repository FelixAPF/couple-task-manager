import { Component, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from '../../service/auth.service';
import { HouseholdService } from '../../service/household.service';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { JoinHouseholdComponent } from '../../household/join-household/join-household.component';
import { Observable, Subscription } from 'rxjs';
import { Household, HouseholdMember, UserRole } from '../../model/household';
import { AppNotification } from '../../model/notification';
import { NotificationService } from '../../service/notification.service';

@Component({
  selector: 'app-navbar',
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  providers: [MessageService]
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  nextBackgroundTheme = Style.Dark;
  private authService = inject(AuthService);
  private householdService = inject(HouseholdService);
  private dialogService = inject(DialogService); // <-- Inject DialogService
  private notificationService = inject(NotificationService);
  USER_ROLE = UserRole;

  showNotifications = false;
  notifications: AppNotification[] = [];
  unreadCount$: Observable<number> = this.notificationService.unreadCount$;

  isLoggedIn$ = this.authService.isLoggedIn$; // Make public for template access
  household$ = this.householdService.household$; // <-- Expose household observable
  currentUser$: Observable<HouseholdMember | null> = this.householdService.currentUser$;
  subscription: Subscription = new Subscription();
  household: Household | null = null;

  // `translate` is now public so the template can read `translate.currentLang`
  // to correctly highlight the active language pill.
  constructor(private router: Router, public translate: TranslateService, private messageService: MessageService, private eRef: ElementRef){}

  ngOnInit(): void {
    setInterval(() => {
      if (this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        if(isLoggedIn){
          this.notificationService.refreshUnreadCount();
        }
      })) {
      }
    }, 60000);

    this.subscription.add(
      this.householdService.retrieveHousehold().subscribe((household) => {
        this.household = household;
      })
    )
  }

  useLanguage(language: string): void {
    this.translate.use(language);
    localStorage.setItem('language', language);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    // Lock background scroll while the drawer is open (mainly helps on mobile/Capacitor)
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  switchStyle(){
    StatusBar.setStyle({ style: this.nextBackgroundTheme, });
    this.nextBackgroundTheme = this.nextBackgroundTheme === Style.Dark ? Style.Light : Style.Dark;
  }

  logout(): void {
    this.isMenuOpen = false; // Close menu if open
    document.body.style.overflow = '';
    this.authService.logout();
  }

  onCopySuccess(): void {
    this.messageService.add({
        severity: 'success',
        summary: 'Copié',
        detail: 'Code de foyer copié dans le presse-papiers!',
        life: 2000 // Shorter duration for copy confirmation
    });
  }

  openJoinHouseholdDialog(): void {
    this.isMenuOpen = false; // Close the navbar menu first
    document.body.style.overflow = '';
    const joinDialogRef = this.dialogService.open(JoinHouseholdComponent, {
        header: 'Rejoindre un foyer existant',
        width: '90%', // Responsive width
        modal: true,
        dismissableMask: true,
        contentStyle: {"overflow": "auto"}, // Basic overflow
        baseZIndex: 10000
    });

      joinDialogRef.onClose.subscribe((joinedSuccessfully?: boolean) => {

    });
  }

  toggleAdminMode(event: any){

  }

  // Toggle the notification panel
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;

    if (this.showNotifications) {
      this.notificationService.getNotifications().subscribe(data => {
        this.notifications = data;
      });
      this.notificationService.markAllAsRead().subscribe();
    }
  }

  // Handle clicking a specific notification
  handleNotificationClick(notification: AppNotification) {
    this.showNotifications = false;

    if (notification.type === 'LETTER' && notification.referenceId) {
      this.router.navigate(['/letters/view', notification.referenceId]);
    } else if (notification.type === 'TASK') {
      this.router.navigate(['/tasks']);
    } else if (notification.type === 'MEAL') {
      this.router.navigate(['/meals']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // Close dropdown / menu when clicking outside, or pressing Escape
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showNotifications = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
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