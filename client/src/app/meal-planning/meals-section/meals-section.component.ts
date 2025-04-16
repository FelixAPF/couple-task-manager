import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
// Import the correct event type
import { SelectButtonChangeEvent, SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { SharedModule } from '../../shared.module';

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
  viewOptions: ViewOption[] = [
    { label: 'Plan Repas', value: null, icon: 'pi pi-calendar' }, // Default view (empty path in outlet)
    { label: 'Recettes', value: 'recipes', icon: 'pi pi-book' }   // Recipes view
  ];

  selectedView: string | null = null; // Initialize based on default route
  private routerSubscription: Subscription | undefined; // Removed initial assignment


  constructor(
    private router: Router,
    private route: ActivatedRoute // Inject ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Subscribe to router events to set the correct initial state
    // and update if the user navigates via browser back/forward
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      // Check the active child route within the 'meals' outlet immediately and on navigation
      startWith(null), // Emit immediately to check current state on init
      map(() => this.route.snapshot.children.find(child => child.outlet === 'meals')),
      map(childSnapshot => childSnapshot?.routeConfig?.path ?? null), // Get path ('recipes' or '')
    ).subscribe(path => {
      // The default route has path '', map it to our null value
      this.selectedView = path === '' ? null : path;
    });
  }

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