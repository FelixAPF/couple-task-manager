import { Component, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Removed registerLocaleData, assuming fr-CA from SharedModule is enough
// import localeFr from '@angular/common/locales/fr'; // Likely not needed if fr-CA is globally registered
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

// registerLocaleData(localeFr); // Keep if fr-CA isn't sufficient or registered

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
    DatePipe
  ]
})
export class MealsListComponent implements OnInit {

  weekDays: WeekDay[] = [];
  isLoading: boolean = true;
  errorLoading: boolean = false;
  private mealsMap = new Map<string, Meal>();

  // --- New properties for week navigation ---
  currentWeekStartDate!: Date; // The Monday of the currently displayed week
  formattedWeekRange: string = ''; // e.g., "Semaine du 29 juil. au 4 août"
  // --- End new properties ---

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
    this.goToCurrentWeek(); // Initialize to the current week
  }

  // --- New method to set the week and load data ---
  displayWeek(): void {
    this.generateWeekDays();
    this.loadMealsForWeek();
  }
  // --- End new method ---

  generateWeekDays(): void {
    this.weekDays = [];
    // Use currentWeekStartDate instead of today
    const monday = new Date(this.currentWeekStartDate);
    monday.setHours(0, 0, 0, 0); // Normalize time

    let weekEndDate: Date | null = null; // To store the Sunday date for range display

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

      if (i === 6) { // Store the last day (Sunday)
        weekEndDate = dayDate;
      }
    }

    // --- Update formatted week range ---
    const startFormatted = this.datePipe.transform(this.currentWeekStartDate, 'd MMM', this.locale);
    const endFormatted = this.datePipe.transform(weekEndDate, 'd MMM yyyy', this.locale); // Include year on end date
    this.formattedWeekRange = `Semaine du ${startFormatted} au ${endFormatted}`;
  }

  loadMealsForWeek(): void {
    // ... (rest of the method remains the same, using the generated weekDays) ...
    if (this.weekDays.length === 0) {
       console.error("Cannot load meals, week days not generated.");
       this.isLoading = false;
       return;
    }

    this.isLoading = true;
    this.errorLoading = false;
    this.mealsMap.clear();

    const startDate = this.weekDays[0].isoDate;
    const endDate = this.weekDays[6].isoDate;

    this.mealService.getMealsByDateRange(startDate, endDate).subscribe({
      next: (meals) => {
        meals.forEach(meal => {
          const mealDate = new Date(meal.date);
          const mealIsoDate = this.datePipe.transform(mealDate, 'yyyy-MM-dd', 'UTC');
          if (mealIsoDate) {
            this.mealsMap.set(mealIsoDate, meal);
          }
        });

        this.weekDays.forEach(day => {
          day.meal = this.mealsMap.get(day.isoDate);
        });

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le plan de repas.' });
      }
    });
  }

  // --- New navigation methods ---
  previousWeek(): void {
    this.currentWeekStartDate.setDate(this.currentWeekStartDate.getDate() - 7);
    // Create a new Date object to trigger change detection if needed, though modifying might be okay
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
    const currentDayOfWeek = (today.getDay() + 6) % 7; // 0=Mon
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0);
    this.currentWeekStartDate = monday;
    this.displayWeek();
  }
  // --- End navigation methods ---

  // ... (editMeal, confirmRemoveMeal, removeMeal, assignMeal, getRecipeName remain the same) ...
  editMeal(meal: any): void {
    this.messageService.add({ severity: 'info', summary: 'Action', detail: `Modification du repas (non implémenté).` });
  }

  confirmRemoveMeal(event: any, meal: any): void {
    if (!meal.id) return;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Êtes-vous sûr de vouloir supprimer le repas prévu pour le ${this.datePipe.transform(meal.date, 'EEEE d MMMM', this.locale)} ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => {
        this.removeMeal(meal);
      },
      reject: () => {
        this.messageService.add({ severity: 'warn', summary: 'Annulé', detail: 'Suppression annulée.' });
      }
    });
  }

  private removeMeal(meal: any): void {
    if (!meal.id) return;
    this.mealService.deleteMeal(meal.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Repas supprimé.' });
        const mealDate = new Date(meal.date);
        const day = this.weekDays.find(d => d.isoDate === this.datePipe.transform(mealDate, 'yyyy-MM-dd', 'UTC'));
        if (day) {
          day.meal = undefined;
        }
      },
      error: (err) => {
        console.error("Error deleting meal:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer le repas.' });
      }
    });
  }
  assignMealDialogRef: DynamicDialogRef | undefined;

  assignMeal(date: any, meal: any): void {
    const dateStr = this.datePipe.transform(date, 'yyyy-MM-dd');

    this.assignMealDialogRef = this.dialogService.open(AssignMealComponent, {
        header: `Assigner un repas`, // Header can be simple
        width: '90%',
        contentStyle: {"max-height": "70vh", "overflow": "auto"},
        baseZIndex: 10000,
        data: { // Pass the target date
          date,
          meal
        }
    });

    // Handle dialog close
    this.assignMealDialogRef.onClose.subscribe((result?: { recipe: Recipe, date: Date }) => {
        if (result && result.recipe && result.date) {
            this.saveAssignedMeal(result.recipe, result.date);
        }
    });
  }

  private saveAssignedMeal(recipe: Recipe, date: Date): void {
    const newMeal: Partial<Meal> = { // Use Partial<Meal> if ID is generated by backend
      date: date,
      recipe: recipe, // Assign the full recipe object
      location: 'Maison' // Default location or leave empty/null
      // Add other default Meal properties if needed
    };

    // Optional: Show loading state on the specific day card?
    this.isLoading = true; // Or a more specific loading indicator

    this.mealService.addMeal(newMeal as Meal).subscribe({ // Cast if necessary, ensure addMeal exists
      next: (savedMeal) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Repas "${recipe.name}" assigné.` });
        this.loadMealsForWeek(); // Reload the week view to show the new meal
      },
      error: (err) => {
        this.isLoading = false; // Ensure loading state is reset on error
        console.error("Error assigning meal:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'assigner le repas.' });
      }
    });
  }

}