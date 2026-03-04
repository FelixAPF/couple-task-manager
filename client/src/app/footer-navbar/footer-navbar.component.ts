import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { AuthService } from '../service/auth.service';
import { SharedModule } from '../shared.module';
import { HouseholdService } from '../service/household.service';
import { Household } from '../model/household';

@Component({
  selector: 'app-footer-navbar',
  imports: [SharedModule, RouterModule],
  templateUrl: './footer-navbar.component.html',
  styleUrl: './footer-navbar.component.css'
})
export class FooterNavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private householdService = inject(HouseholdService);
  household: Household | null;

  
  ngOnInit(): void {
    this.householdService.household$.subscribe((household) => {
      this.household = household;
    })
  }


  isLoggedIn$ = this.authService.isLoggedIn$; // Make public for template access

  public async openAppStore(): Promise<void> {
    await AppUpdate.openAppStore();
  }
}
