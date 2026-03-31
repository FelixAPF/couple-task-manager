import { AfterViewInit, ChangeDetectorRef, Component, ComponentRef, inject, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { MealService } from '../../service/meal.service';
import { SharedModule } from '../../shared.module';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Meal } from '../../model/meals';
import { MealsListComponent } from '../meals-list/meals-list.component';
import { WeekDayContext } from '../../shared/week-navigation-control/week-navigation-control.component';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface MealDayContext extends WeekDayContext {
  meal?: Meal
}

@Component({
  selector: 'app-move-meal',
  imports: [SharedModule, FormsModule],
  templateUrl: './move-meal.component.html',
  styleUrl: './move-meal.component.css',
  providers: [MessageService],
})
export class MoveMealComponent implements OnInit, AfterViewInit, OnDestroy { // Implement lifecycle hooks
  

  // --- Container for dynamic component ---
  @ViewChild('mealListContainer', { read: ViewContainerRef, static: true })
  mealListContainer!: ViewContainerRef;
  private mealListComponentRef: ComponentRef<MealsListComponent> | null = null;
  private dateSelectedSubscription: Subscription | null = null;

  // --- End Container ---

  selectedDate: Date | null = null; // Date selected by the dynamic component
  selectedMeal: Meal | null = null; // Meal selected by the dynamic component
  providedMeal: Meal | null = null;

  // Inject services and config
  private config = inject(DynamicDialogConfig);
  private mealService = inject(MealService);
  private ref = inject(DynamicDialogRef);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

  ngOnInit(): void {
    if (this.config.data && this.config.data.meal) {
      this.providedMeal = this.config.data.meal;
    } else {
      console.error("MoveMealComponent: Meal data not provided!");
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Données de repas manquantes.' });
      this.ref.close(false);
    }
  }

  ngAfterViewInit(): void {
    // Dynamically load MealsListComponent after the view is initialized
    this.loadMealsListComponent();
  }

  ngOnDestroy(): void {
    // Clean up the dynamically loaded component and subscription
    this.dateSelectedSubscription?.unsubscribe();
    this.mealListComponentRef?.destroy();
  }

  private loadMealsListComponent(): void {
    this.mealListContainer.clear(); // Clear any previous content

    // Create the component dynamically
    this.mealListComponentRef = this.mealListContainer.createComponent(MealsListComponent);

    // Pass necessary inputs to the component instance
    this.mealListComponentRef.instance.enableDateSelection = true;
    this.mealListComponentRef.instance.enableCardModification = false;
    this.mealListComponentRef.instance.initialSelectedDay = this.config.data.date;
    // You might want to set the initial week based on the providedMeal's date
    // this.mealListComponentRef.instance.currentWeekStartDate = /* calculate start date */;

    // Subscribe to the output event
    this.dateSelectedSubscription = this.mealListComponentRef.instance.weekDaySelect.subscribe(day => {
      this.onDateSelectedFromList(day);
    });

    // Trigger change detection as dynamic loading happens outside the normal cycle
    this.cdr.detectChanges();
  }

  onDateSelectedFromList(day: MealDayContext | null) {
    this.selectedDate = day?.date || null;
    
    // FIX: The emitted 'day' object does not contain the meal. 
    // We must fetch it directly from the MealsListComponent instance!
    if (day && day.isoDate && this.mealListComponentRef) {
      this.selectedMeal = this.mealListComponentRef.instance.getMealForDay(day.isoDate) || null;
    } else {
      this.selectedMeal = null;
    }

    // Force Angular to update the view so the swap buttons appear
    this.cdr.detectChanges();
  }

  submitMove() {
    if (!this.selectedDate) {
      this.messageService.add({ severity: 'warn', summary: 'Date manquante', detail: 'Veuillez sélectionner une nouvelle date dans la liste.' });
      return;
    }
    if (!this.providedMeal) {
      console.error("Cannot move meal: Meal data is missing.");
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de déplacer, données de repas manquantes.' });
      this.ref.close(false);
      return;
    }
    this.mealService.moveMeal(this.providedMeal, this.selectedDate).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Repas déplacé avec succès.' });
        this.ref.close(response); // Close the dialog and indicate success
      },
      error: (error) => {
        console.error('Error moving meal:', error);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le déplacement du repas a échoué.' });
        // Don't close on error
      }
    });

    // Optional: Add loading state indication
 
  }

swapMeal() {
    if (this.providedMeal && this.selectedDate) {
      this.mealService.swapMeal(this.providedMeal, this.selectedDate).subscribe({
        next: (result) => {
          // CRITICAL: Close the dialog and pass the result back to the parent
          this.ref.close(result);
        },
        error: (err) => {
          console.error('Error swapping meals:', err);
          // Optional: You can also use this.messageService here to show a toast error
        }
      });
    }
  }
  

  cancelMove() {
    this.ref.close(false);
  }
}