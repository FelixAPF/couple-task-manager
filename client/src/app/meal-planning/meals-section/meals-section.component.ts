import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SharedModule } from '../../shared.module';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-meals-section',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    RouterOutlet,
    FormsModule
  ],
  templateUrl: './meals-section.component.html',
  styleUrl: './meals-section.component.css'
})
export class MealsSectionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public translate = inject(TranslateService);
  private routerSubscription?: Subscription;

  activeTab: 'plan' | 'recipes' = 'plan';

  ngOnInit(): void {
    this.updateActiveTab();
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateActiveTab());
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private updateActiveTab(): void {
    const child = this.route.snapshot.children.find(c => c.outlet === 'meals');
    this.activeTab = child?.routeConfig?.path === 'recipes' ? 'recipes' : 'plan';
  }

  switchTab(tab: 'plan' | 'recipes'): void {
    this.activeTab = tab;
    this.router.navigate(
      [{ outlets: { meals: tab === 'recipes' ? ['recipes'] : null } }],
      { relativeTo: this.route }
    );
  }
}