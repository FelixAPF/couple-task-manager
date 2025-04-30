// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\meal-planning\meals-list\meals-list.component.ts
import { Component, OnInit, LOCALE_ID, Inject, EventEmitter } from '@angular/core';
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
import { MoveMealComponent } from '../move-meal/move-meal.component';
import { HammerModule } from '@angular/platform-browser';
import { Input, Output } from '@angular/core';
import { LoadingService } from '../../service/loading/loading.service';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';

export interface WeekDay {
  id: number;
  date: Date;
  formattedDate: string;
  borderClass: string;
  isoDate: string;
  meal?: Meal;
  isBirthday?: boolean;
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
    HammerModule
  ]
})
export class MealsListComponent implements OnInit {

  @Output() weekDaySelect: EventEmitter<WeekDay | null> = new EventEmitter(); // For date selection in the parent component
  @Input() enableDateSelection: boolean = false; // For enabling date selection in the parent component
  @Input() enableCardModification: boolean = true; // For enabling card modification in the parent component
  selectedDay: WeekDay | null = null; // For storing the selected day


  weekDays: WeekDay[] = [];
  errorLoading: boolean = false;
  private mealsMap = new Map<string, Meal>();
  swipeTransform = 'translateX(0)';
  householdMembersBirthdays: undefined | Date[] = undefined; // Store household members' birthdays

  currentWeekStartDate!: Date;
  formattedWeekRange: string = '';

  constructor(
    private mealService: MealService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private router: Router,
    private dialogService: DialogService,
    private loadingService: LoadingService,
    private householdService: HouseholdService,
    @Inject(LOCALE_ID) private locale: string
  ) {

  }



  ngOnInit(): void {
    this.householdService.retrieveHousehold().subscribe(household => {
      if (household?.members) {
        this.householdMembersBirthdays = household.members
          .map((member: HouseholdMember) => {
            if (!member.birthDay) {
              return null; // Or handle as needed
            }
            try {
              const birthday = new Date(member.birthDay); // Original method
              
              if (isNaN(birthday.getTime())) { // Check if Date is invalid
                console.error("Invalid Date parsed for member:", member, "Raw value:", member.birthDay);
                return null;
              }
              birthday.setFullYear(new Date().getFullYear()); 
              birthday.setHours(0, 0, 0, 0); 
              return birthday;
    
            } catch (error) {
                return null;
            }
          })
          .filter((date): date is Date => date !== null); // Filter out any nulls from mapping/errors 
    
        this.goToCurrentWeek();
        
      } else { 
        this.householdMembersBirthdays = []; // Ensure it's an empty array
      }
    });
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
      dayDate.setHours(0, 0, 0, 0); // Ensure dayDate is also normalized

      const formatted = this.datePipe.transform(dayDate, 'EEEE d MMMM', this.locale) || '';
      const iso = this.datePipe.transform(dayDate, 'yyyy-MM-dd') || '';

      // --- Birthday Check Logic ---
      let isBirthday = false; // Start assuming it's not a birthday
      if (this.householdMembersBirthdays) {
        const currentMonth = dayDate.getMonth(); // 0-11
        const currentDayOfMonth = dayDate.getDate(); // 1-31

        // Check if any birthday in the array matches the current month and day
        isBirthday = this.householdMembersBirthdays.some(birthday => 
            birthday.getMonth() === currentMonth && birthday.getDate() === currentDayOfMonth
        );
      }
      // --- End Birthday Check ---

      this.weekDays.push({
        id: i,
        date: dayDate,
        formattedDate: formatted.charAt(0).toUpperCase() + formatted.slice(1),
        borderClass: this.enableCardModification ? this.getPositionInCycle(dayDate) || '' : '',
        isoDate: iso,
        meal: undefined,
        isBirthday 
      }); 

      if (i === 6) {
        weekEndDate = dayDate;
      }
    } 


    const startFormatted = this.datePipe.transform(this.currentWeekStartDate, 'd MMM', this.locale);
    const endFormatted = this.datePipe.transform(weekEndDate, 'd MMM', this.locale); // Removed extra 'yyyy'
    this.formattedWeekRange = `Semaine du ${startFormatted} au ${endFormatted}`;
  }

  swipeNavigation(event: any) {
    switch (event.direction) {
      case 4:
        this.previousWeek();
        break;
      case 2:
        this.nextWeek();
        break;
      default:
        break;
    }
  }

  getBorderClass(day: WeekDay): string {
    if(!this.enableCardModification){
      if(day.id === this.selectedDay?.id){
        return "selected";
      }
      return "";
    } 
    
    return day.borderClass; // Default
  }

  loadMealsForWeek(): void {
    this.selectedDay = null; // Reset selected day when loading new meals
    if (this.weekDays.length === 0) {
       console.error("Cannot load meals, week days not generated.");
       return;
    }

    this.errorLoading = false;
    this.mealsMap.clear(); // Clear previous week's data

    // Clear existing meals from weekDays before loading new ones
    this.weekDays.forEach(day => day.meal = undefined);

    const startDateMillis = this.weekDays[0].date.getTime();
    const endDateMillis = this.weekDays[6].date.getTime() + (24 * 60 * 60 * 1000);

    this.mealService.getMealsByDateRange(startDateMillis, endDateMillis).subscribe({
      next: (meals) => {
        meals.forEach(meal => {
          // Ensure date comparison is robust (handle timezones/normalization)
          const mealDate = new Date(meal.date);
          const mealIsoDate = this.datePipe.transform(mealDate, 'yyyy-MM-dd');
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
      },
      error: (err) => {
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
      },
      error: (err) => {
        console.error("Error deleting meal:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer le repas.' });
      }
    });
  }

  assignMeal(date: Date, existingMeal?: Meal): void {
    // Use local const dialogRef instead of this.assignMealDialogRef
    const dialogRef: DynamicDialogRef | undefined = this.dialogService.open(AssignMealComponent, {
        width: '90%',
        modal: true,
        dismissableMask: true,
        contentStyle: {"max-height": "80vh", "overflow": "auto"},
        baseZIndex: 10000,
        data: {
          date: date,
          meal: existingMeal
        }
    });

    // Handle dialog close using the local const
    // Add a check in case dialogRef is somehow undefined (though unlikely)
    if (dialogRef) {
      dialogRef.onClose.subscribe((result?: { recipe: Recipe, date: Date, location: string }) => {
          if (result && result.recipe && result.date && result.location !== undefined) {
              const mealToSave: Meal = {
                  id: existingMeal?.id,
                  recipe: result.recipe,
                  date: result.date,
                  location: result.location
              };
              this.saveAssignedMeal(mealToSave);
          }
      });
    } else {
        console.error("Failed to open AssignMealComponent dialog.");
        // Optionally show an error message to the user
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'ouvrir la fenêtre d'assignation." });
    }
  }

  today: string = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
  getPositionInCycle(date: Date): "first" | "today" | "last" | null {
    const cycleStartUTC = Date.UTC(2024, 0, 1); // 1er janvier 2024 à minuit UTC
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    let compareDate = date.toISOString().slice(0, 10);
    if(compareDate === this.today){
      return "today";
    }  // Today check

    const msInDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = Math.floor((dateUTC - cycleStartUTC) / msInDay);

    if (daysSinceStart < 0) return null;

    const cycleLength = 14;
    const position = daysSinceStart % cycleLength;

    if (position === 0) return "first";
    if (position === cycleLength - 1) return "last";
    return null;
  }

  // Updated to accept a Meal object (can be partial for creation, needs ID for update)
  private saveAssignedMeal(meal: Meal): void {

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
        const action = meal.id ? 'mettre à jour' : 'assigner';
        console.error(`Error ${action} meal:`, err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Impossible de ${action} le repas.` });
      }
    });
  }

  selectDay(day: WeekDay): void {
    if (this.enableDateSelection) {
      this.selectedDay = day;
      this.weekDaySelect.emit(day); // Emit the selected date to the parent component
    } else {
      this.selectedDay = null; // Reset if not enabled
    }
  }

  moveMeal(date: Date, meal?: Meal): void {
    //Display date picker to select a new date
    const ref = this.dialogService.open(MoveMealComponent, {
      header: 'Déplacer le repas',
      width: '90%',
      modal: true,
      dismissableMask: true,
      data: {
        date: date,
        meal: meal
      }
    });
    ref.onClose.subscribe((result: Meal | null) => {
      if (result) {
        this.loadMealsForWeek(); // Reload the week view
      }
    });


  }

}
