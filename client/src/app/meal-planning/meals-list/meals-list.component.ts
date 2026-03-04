import { Component, OnInit, LOCALE_ID, Inject, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { Meal } from '../../model/meals';
import { MealService } from '../../service/meal.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { MealAssignDialogComponent } from "../meal-assign-dialog/meal-assign-dialog.component"
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
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';
import { WeekNavigationControlComponent, WeekDayContext, WeekRangeEvent } from '../../shared/week-navigation-control/week-navigation-control.component';

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
    MealCardComponent,
    WeekNavigationControlComponent
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

  @Output() weekDaySelect: EventEmitter<WeekDayContext | null> = new EventEmitter();
  @Input() enableDateSelection: boolean = false;
  @Input() enableCardModification: boolean = true;
  @Input() initialSelectedDay: Date | null = null;
  
  selectedDay: WeekDayContext | null = null;
  errorLoading: boolean = false;
  
  private mealsMap = new Map<string, Meal>();
  private currentStartDate: Date | null = null;
  private currentEndDate: Date | null = null;
  
  householdMembersBirthdays: Date[] = [];
  householdMembers: HouseholdMember[] = [];
  today: string = new Date().toISOString().slice(0, 10);

  constructor(
    private mealService: MealService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private datePipe: DatePipe,
    private router: Router,
    private dialogService: DialogService,
    private householdService: HouseholdService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    if(this.initialSelectedDay){
      this.selectedDay = {
        id: -1,
        date: this.initialSelectedDay,
        formattedDate: this.datePipe.transform(this.initialSelectedDay, 'EEEE d MMMM', this.locale) || '',
        isoDate: this.datePipe.transform(this.initialSelectedDay, 'yyyy-MM-dd') || '',
        isBirthday: false,
        isToday: false
      };
    }

    this.householdService.retrieveHousehold().subscribe(household => {
      if (household?.members) {
        this.householdMembers = household.members;
        this.householdMembersBirthdays = household.members
          .map((member: HouseholdMember) => {
            if (!member.birthDay) return null;
            try {
              const birthday = new Date(member.birthDay);
              if (isNaN(birthday.getTime())) return null;
              birthday.setFullYear(new Date().getFullYear()); 
              birthday.setHours(0, 0, 0, 0); 
              return birthday;
            } catch (error) {
                return null;
            }
          })
          .filter((date): date is Date => date !== null);
      } else { 
        this.householdMembersBirthdays = [];
      }
    });
  }

  onWeekChanged(event: WeekRangeEvent): void {
    this.currentStartDate = event.startDate;
    this.currentEndDate = event.endDate;
    this.loadMealsForWeek();
  }

  loadMealsForWeek(): void {
    if (!this.currentStartDate || !this.currentEndDate) return;

    this.selectedDay = null; 
    this.errorLoading = false;
    this.mealsMap.clear(); 

    const startDateMillis = this.currentStartDate.getTime();
    const endDateMillis = this.currentEndDate.getTime() + (24 * 60 * 60 * 1000);

    this.mealService.getMealsByDateRange(startDateMillis, endDateMillis).subscribe({
      next: (meals) => {
        meals.forEach(meal => {
          const mealDate = new Date(meal.date);
          const mealIsoDate = this.datePipe.transform(mealDate, 'yyyy-MM-dd');
          if (mealIsoDate) {
            this.mealsMap.set(mealIsoDate, meal);
          }
        });

        setTimeout(() => {
          const el = document.getElementById("today");
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 400);
      },
      error: (err) => {
        this.errorLoading = true;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le plan de repas.' });
        console.error("Error loading meals:", err);
      }
    });
  }

  getMealForDay(isoDate: string): Meal | undefined {
    return this.mealsMap.get(isoDate);
  }

  getBorderClass(day: WeekDayContext): string {
    if (!this.enableCardModification) {
      if (day.id === this.selectedDay?.id) {
        return "selected";
      }
      return "";
    } 
    return this.getPositionInCycle(day.date) || '';
  }

  getPositionInCycle(date: Date): "first" | "today" | "last" | null {
    const cycleStartUTC = Date.UTC(2024, 0, 1);
    const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    let compareDate = date.toISOString().slice(0, 10);
    
    if (compareDate === this.today) return "today";

    const msInDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = Math.floor((dateUTC - cycleStartUTC) / msInDay);

    if (daysSinceStart < 0) return null;

    const cycleLength = 14;
    const position = daysSinceStart % cycleLength;

    if (position === 0) return "first";
    if (position === cycleLength - 1) return "last";
    return null;
  }

  selectDay(day: WeekDayContext): void {
    if (this.enableDateSelection) {
      this.selectedDay = day;
      this.weekDaySelect.emit(day);
    } else {
      this.selectedDay = null;
    }
  }

  confirmAssignMeal(day: WeekDayContext): void {
    const meal = this.getMealForDay(day.isoDate);
    if(meal === undefined) return;
    
    this.dialogService.open(MealAssignDialogComponent, {
      data: { householdMembers: this.householdMembers },
      dismissableMask: true,
      modal:true
    }).onClose.subscribe((result) => {
      if(result !== null && !result) return;

      meal.isThawingNeeded = result.isThawingNeeded;
      this.mealService.assignMeal(meal, result === null ? 0 : result).subscribe(() => {
        this.loadMealsForWeek();
      });
    });
  }

  assignMeal(date: Date, existingMeal?: Meal): void {
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

    if (dialogRef) {
      dialogRef.onClose.subscribe((result?: { recipe: Recipe, date: Date, location: string, isThawingNeeded: boolean, assignee: any }) => {
          if (result && result.recipe && result.date && result.location !== undefined) {
              const mealToSave: Meal = {
                  id: existingMeal?.id,
                  recipe: result.recipe,
                  date: result.date,
                  location: result.location,
                  assignedUser: result.assignee,
                  isThawingNeeded: result.isThawingNeeded
              };
              this.saveAssignedMeal(mealToSave);
          }
      });
    } else {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'ouvrir la fenêtre d'assignation." });
    }
  }

  private saveAssignedMeal(meal: Meal): void {
    const saveObservable = meal.id
        ? this.mealService.updateMeal(meal)
        : this.mealService.addMeal(meal);

    saveObservable.subscribe({
      next: () => {
        const action = meal.id ? 'mis à jour' : 'assigné';
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Repas "${meal.recipe.name}" ${action}.` });
        this.loadMealsForWeek(); 
      },
      error: (err) => {
        const action = meal.id ? 'mettre à jour' : 'assigner';
        console.error(`Error ${action} meal:`, err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Impossible de ${action} le repas.` });
      }
    });
  }

  moveMeal(date: Date, meal?: Meal): void {
    const ref = this.dialogService.open(MoveMealComponent, {
      header: 'Déplacer le repas',
      width: '90%',
      modal: true,
      dismissableMask: true,
      data: { date: date, meal: meal }
    });
    ref.onClose.subscribe((result: Meal | null) => {
      if (result) {
        this.loadMealsForWeek();
      }
    });
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
      }
    });
  }

  private removeMeal(meal: Meal): void {
    if (!meal.id) return;
    this.mealService.deleteMeal(meal.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Repas supprimé.' });
        const mealDate = new Date(meal.date);
        const mealIsoDate = this.datePipe.transform(mealDate, 'yyyy-MM-dd', 'UTC');
        this.mealsMap.delete(mealIsoDate!); 
      },
      error: (err) => {
        console.error("Error deleting meal:", err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer le repas.' });
      }
    });
  }
}