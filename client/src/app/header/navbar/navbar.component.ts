import { Component, inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AuthService } from '../../service/auth.service';
import { HouseholdService } from '../../service/household.service';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { JoinHouseholdComponent } from '../../household/join-household/join-household.component';

@Component({
  selector: 'app-navbar',
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  providers: [MessageService, DialogService]
})
export class NavbarComponent {
  isMenuOpen = false;
  nextBackgroundTheme = Style.Dark;
  private authService = inject(AuthService);
  private householdService = inject(HouseholdService);
  private dialogService = inject(DialogService); // <-- Inject DialogService



  isLoggedIn$ = this.authService.isLoggedIn$; // Make public for template access
  household$ = this.householdService.household$; // <-- Expose household observable

  constructor(private router: Router, private translate: TranslateService, private messageService: MessageService){}

  useLanguage(language: string): void {
    this.translate.use(language);
  }

toggleMenu(): void {
  this.isMenuOpen = !this.isMenuOpen;
}

  switchStyle(){
    StatusBar.setStyle({ style: this.nextBackgroundTheme, });
    this.nextBackgroundTheme = this.nextBackgroundTheme === Style.Dark ? Style.Light : Style.Dark;
  }

  logout(): void {
    this.isMenuOpen = false; // Close menu if open
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
    const joinDialogRef = this.dialogService.open(JoinHouseholdComponent, {
        header: 'Rejoindre un foyer existant',
        width: '90%', // Responsive width
        modal: true,
        dismissableMask: true,
        contentStyle: {"overflow": "auto"}, // Basic overflow
        baseZIndex: 10000
    });

    // Optional: Handle dialog close if needed (e.g., refresh something specific)
      joinDialogRef.onClose.subscribe((joinedSuccessfully?: boolean) => {
        if (joinedSuccessfully) {
            console.log('Dialog closed after successfully joining household.');
            // The householdService should have updated the state,
            // components observing household$ will update automatically.
            // You might trigger an additional global refresh if necessary.
        } else {
            console.log('Join household dialog closed without joining.');
        }
    });
  }

}
