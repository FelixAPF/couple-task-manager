// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\meal-planning\meals-list\meals-list.component.ts
import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { Meal } from '../../model/meals';
import { MealService } from '../../service/meal.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { Router } from '@angular/router';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AssignMealComponent } from '../assign-meal/assign-meal.component';
import { Recipe } from '../../model/recipes';
import { MealCardComponent } from '../meal-card/meal-card.component';

interface WeekDay {
  date: Date;
  formattedDate: string;
  isoDate: string;
  meal?: Meal;
}

@Component({
  selector: 'app-meals-list',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
    MealCardComponent
  ],
  templateUrl: './meals-list.component.html',
  styleUrls: ['./meals-list.component.css'],
  providers: [
    ConfirmationService,
    MessageService,
    DatePipe,
    DialogService // <-- Ensure DialogService is provided if not globally
  ]
})
export class MealsListComponent implements OnInit {

  weekDays: WeekDay[] = [];
  isLoading: boolean = true;
  errorLoading: boolean = false;
  private mealsMap = new Map<string, Meal>();

  currentWeekStartDate!: Date;
  formattedWeekRange: string = '';

  constructor(
    private mealService: MealService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private router: Router,
    private dialogService: DialogService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.goToCurrentWeek();
  }

  displayWeek(): void {
    this.generateWeekDays();
    this.loadMealsForWeek();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const monday = new Date(this.currentWeekStartDate);
    monday.setHours(0, 0, 0, 0);

    let weekEndDate: Date | null = null;

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);

      const formatted = this.datePipe.transform(dayDate, 'EEEE d MMMM', this.locale) || '';
      const iso = this.datePipe.transform(dayDate, 'yyyy-MM-dd') || '';

      this.weekDays.push({
        date: dayDate,
        formattedDate: formatted.charAt(0).toUpperCase() + formatted.slice(1),
        isoDate: iso,
        meal: undefined
      });

      if (i === 6) {
        weekEndDate = dayDate;
      }
    }

    const startFormatted = this.datePipe.transform(this.currentWeekStartDate, 'd MMM', this.locale);
    const endFormatted = this.datePipe.transform(weekEndDate, 'd MMM yyyy', this.locale);
    this.formattedWeekRange = `Semaine du ${startFormatted} au ${endFormatted}`;
  }

  loadMealsForWeek(): void {
    if (this.weekDays.length === 0) {
       console.error("Cannot load meals, week days not generated.");
       this.isLoading = false;
       return;
    }

    this.isLoading = true;
    this.errorLoading = false;
    this.mealsMap.clear(); // Clear previous week's data

    // Clear existing meals from weekDays before loading new ones
    this.weekDays.forEach(day => day.meal = undefined);

    const startDate = this.weekDays[0].isoDate;
    const endDate = this.weekDays[6].isoDate;

    this.mealService.getMealsByDateRange(startDate, endDate).subscribe({
      next: (meals) => {
        meals.forEach(meal => {
          // Ensure date comparison is robust (handle timezones/normalization)
          const mealDate = new Date(meal.date);
          // Convert meal date to UTC YYYY-MM-DD for reliable map key
          const mealIsoDate = this.datePipe.transform(mealDate, 'yyyy-MM-dd', 'UTC');
          if (mealIsoDate) {
            this.mealsMap.set(mealIsoDate, meal);
          } else {
            console.warn("Could not format meal date:", meal.date);
          }
        });

        this.weekDays.forEach(day => {
          // Use the same ISO format for lookup
          day.meal = this.mealsMap.get(day.isoDate);
        });

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le plan de repas.' });
        console.error("Error loading meals:", err);
      }
    });
  }

  previousWeek(): void {
    this.currentWeekStartDate.setDate(this.currentWeekStartDate.getDate() - 7);
    this.currentWeekStartDate = new Date(this.currentWeekStartDate);
    this.displayWeek();
  }

  nextWeek(): void {
    this.currentWeekStartDate.setDate(this.currentWeekStartDate.getDate() + 7);
    this.currentWeekStartDate = new Date(this.currentWeekStartDate);
    this.displayWeek();
  }

  goToCurrentWeek(): void {
    const today = new Date();
    const currentDayOfWeek = (today.getDay() + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0); // Normalize to start of day
    this.currentWeekStartDate = monday;
    this.displayWeek();
  }

  editMeal(meal: Meal): void {
    // Re-use assignMeal for editing, passing the existing meal data
    this.assignMeal(meal.date, meal);
  }

  confirmRemoveMeal(event: Event, meal: Meal | undefined): void {
    if (!meal || !meal.id) return;

    const formattedDate = this.datePipe.transform(meal.date, 'EEEE d MMMM', this.locale) || 'cette date';
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer le repas "${meal.recipe?.name || 'ce repas'}" prévu pour le ${formattedDate} ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.removeMeal(meal);
      },
      reject: () => {
        // Optional: Add message if needed
        // this.messageService.add({ severity: 'info', summary: 'Annulé', detail: 'Suppression annulée.' });
      }
    });
  }

  private removeMeal(meal: Meal): void {
    if (!meal.id) return;
    // Optional: Show loading state on the specific card
    this.isLoading = true; // Or a more specific indicator
    this.mealService.deleteMeal(meal.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Repas supprimé.' });
        // Find the day and remove the meal visually immediately
        const mealDate = new Date(meal.date);
        const mealIsoDate = this.datePipe.transform(mealDate, 'yyyy-MM-dd', 'UTC');
        const day = this.weekDays.find(d => d.isoDate === mealIsoDate);
        if (day) {
          day.meal = undefined;
        }
        this.mealsMap.delete(mealIsoDate!); // Also remove from map
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error("Error deleting meal:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer le repas.' });
      }
    });
  }

  assignMealDialogRef: DynamicDialogRef | undefined;

  assignMeal(date: Date, existingMeal?: Meal): void { // Accept existingMeal
    this.assignMealDialogRef = this.dialogService.open(AssignMealComponent, {
        width: '90%', // Adjust as needed for mobile/desktop
        contentStyle: {"max-height": "80vh", "overflow": "auto"},
        baseZIndex: 10000,
        data: {
          date: date,
          meal: existingMeal // Pass the existing meal object if editing
        }
    });

    // Handle dialog close
    this.assignMealDialogRef.onClose.subscribe((result?: { recipe: Recipe, date: Date, location: string }) => { // <-- Expect location
        if (result && result.recipe && result.date && result.location !== undefined) { // <-- Check location exists
            // If editing, we need the existing meal's ID
            const mealToSave: Meal = {
                id: existingMeal?.id, // Include ID if editing, undefined if creating
                recipe: result.recipe,
                date: result.date,
                location: result.location // <-- Use received location
            };
            this.saveAssignedMeal(mealToSave); // Pass the full Meal object
        }
    });
  }

  // Updated to accept a Meal object (can be partial for creation, needs ID for update)
  private saveAssignedMeal(meal: Meal): void {
    this.isLoading = true; // Or a more specific loading indicator

    const saveObservable = meal.id
        ? this.mealService.updateMeal(meal) // Use update if ID exists
        : this.mealService.addMeal(meal);   // Use add if no ID (new meal)

    saveObservable.subscribe({
      next: (savedMeal) => {
        const action = meal.id ? 'mis à jour' : 'assigné';
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Repas "${meal.recipe.name}" ${action}.` });
        this.loadMealsForWeek(); // Reload the week view
      },
      error: (err) => {
        this.isLoading = false;
        const action = meal.id ? 'mettre à jour' : 'assigner';
        console.error(`Error ${action} meal:`, err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Impossible de ${action} le repas.` });
      }
    });
  }

}
