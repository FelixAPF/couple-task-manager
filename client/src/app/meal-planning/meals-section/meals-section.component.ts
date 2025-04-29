import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
// Import the correct event type
import { SelectButtonChangeEvent, SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { SharedModule } from '../../shared.module';
import { TranslateService } from '@ngx-translate/core';

interface ViewOption {
  label: string;
  value: string | null; // Use null for the default route
  icon: string;
}

@Component({
  selector: 'app-meals-section',
  standalone: true,
  imports: [
    SharedModule,
    RouterOutlet,
    FormsModule 
  ],
  templateUrl: './meals-section.component.html',
  styleUrl: './meals-section.component.css'
})
// Add OnInit, OnDestroy implementation
export class MealsSectionComponent implements OnInit, OnDestroy {
  translate = inject(TranslateService);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}
  
  viewOptions: ViewOption[] = [
    { label: this.translate.instant('meals.plan'), value: null, icon: 'pi pi-calendar' }, // Default view (empty path in outlet)
    { label: this.translate.instant('meals.recipes'), value: 'recipes', icon: 'pi pi-book' }   // Recipes view
  ];

  ngOnInit(): void {
    const initialChildSnapshot = this.route.snapshot.children.find(child => child.outlet === 'meals');
    const initialPath = initialChildSnapshot?.routeConfig?.path ?? null;
    this.selectedView = initialPath === '' ? null : initialPath;
  }


  selectedView: string | null = null; // Initialize based on default route
  private routerSubscription: Subscription | undefined; // Removed initial assignment


  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  // Method to handle navigation when the select button changes
  // Update the parameter type here:
  onViewChange(event: SelectButtonChangeEvent): void {
    // event.value will contain the selected option's value (string | null)
    const view = event.value;
    this.router.navigate(
      [{ outlets: { meals: view ? [view] : null } }],
      {
        relativeTo: this.route, // Navigate relative to the current activated route (/meals)
        // queryParamsHandling: 'preserve' // Optional: if you need to preserve query params
      }
    );
  }
}