import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { Subscription } from 'rxjs';
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
export class FooterNavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private householdService = inject(HouseholdService);
  household: Household | null = null;

  private subscription = new Subscription();

  isLoggedIn$ = this.authService.isLoggedIn$; // Make public for template access

  ngOnInit(): void {
    this.subscription.add(
      this.householdService.household$.subscribe((household) => {
        this.household = household;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public async openAppStore(): Promise<void> {
    await AppUpdate.openAppStore();
  }
}