import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { AuthService } from '../service/auth.service';
import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-footer-navbar',
  imports: [SharedModule, RouterModule],
  templateUrl: './footer-navbar.component.html',
  styleUrl: './footer-navbar.component.css'
})
export class FooterNavbarComponent {
  private authService = inject(AuthService);


  isLoggedIn$ = this.authService.isLoggedIn$; // Make public for template access

  public async openAppStore(): Promise<void> {
    await AppUpdate.openAppStore();
  }
}
