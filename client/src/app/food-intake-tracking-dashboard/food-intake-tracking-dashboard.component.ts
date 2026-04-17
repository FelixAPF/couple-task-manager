import { Component, inject, LOCALE_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HouseholdMemberSelectorComponent } from '../shared/household-member-selector/household-member-selector.component';
import { HouseholdMember } from '../model/household';
import { SharedModule } from '../shared.module';
import { WeekDayContext, WeekNavigationControlComponent, WeekRangeEvent } from '../shared/week-navigation-control/week-navigation-control.component';
import { HouseholdService } from '../service/household.service';
import { FoodIntakeService } from '../service/food-intake.service';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

export enum FoodIntakeMealType {
  BREAKFAST = "breakfast", 
  LUNCH = "lunch", 
  DINNER = "dinner", 
  SNACK = "snack"
}

export interface FoodIntakeUnit {
  id?: number; 
  date: string; 
  assigneeId: number; 
  description: string;
  mealType: FoodIntakeMealType;
  porteinPortion: number;
  vegetablePortion: number;
  carbohydratePortion: number;
  fatPortion: number;
  imageUrl?: string | null; 
}

@Component({
  selector: 'app-food-intake-tracking-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ChartModule, 
    HouseholdMemberSelectorComponent, 
    SharedModule, 
    WeekNavigationControlComponent, 
    TooltipModule,
    DialogModule,
    ButtonModule,
    RippleModule
  ],
  templateUrl: './food-intake-tracking-dashboard.component.html',
  styleUrl: './food-intake-tracking-dashboard.component.css',
  providers: [DatePipe]
})
export class FoodIntakeTrackingDashboardComponent implements OnInit {

  public FoodIntakeMealType = FoodIntakeMealType;

  private householdService: HouseholdService = inject(HouseholdService);
  private foodIntakeService: FoodIntakeService = inject(FoodIntakeService);

  initialSelectedDay: Date | null = null;
  selectedDay: WeekDayContext | null = null;
  formatedTodayDate: string = "";
  householdMembers: HouseholdMember[] = [];
  householdMembersBirthdays: Date[] = [];
  selectedMember: HouseholdMember | null = null; 
  options: any;
  currentStartDate: Date | null = null;
  currentEndDate: Date | null = null;

  intakeData: FoodIntakeUnit[] = [];
  chartData: any;

  // Add/Edit Dialog State
  displayMealDialog: boolean = false;
  isEditMode: boolean = false;
  editingMeal: Partial<FoodIntakeUnit> = {};

  // Photo Viewer State
  displayImageViewer: boolean = false;
  viewerImageUrl: string = '';
  
  constructor(private datePipe: DatePipe, @Inject(LOCALE_ID) private locale: string) {}
  
  get filteredIntakeData() {
    if (!this.selectedMember || !this.selectedMember.id) return [];
    return this.intakeData.filter(m => m.assigneeId === this.selectedMember!.id);
  }

  get proteinCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.porteinPortion, 0); }
  get vegetableCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.vegetablePortion, 0); }
  get carbohydrateCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.carbohydratePortion, 0); }
  get fatCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.fatPortion, 0); }
  
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

    this.formatedTodayDate = this.datePipe.transform(new Date(), 'EEEE d MMMM', this.locale) || '';

    this.householdService.retrieveHousehold().subscribe(household => {
      if (household?.members && household.members.length > 0) {
        this.householdMembers = household.members;
        this.selectedMember = household.currentUser ?? household.members[0];

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
          
        this.updateChartData();
      } else { 
        this.householdMembersBirthdays = [];
      }
    });
  }

  loadMeals(): void {
    if (!this.currentStartDate || !this.currentEndDate) return;
    
    const startStr = this.datePipe.transform(this.currentStartDate, 'yyyy-MM-dd')!;
    const endStr = this.datePipe.transform(this.currentEndDate, 'yyyy-MM-dd')!;

    this.foodIntakeService.getIntakeUnits(startStr, endStr).subscribe({
      next: (data) => {
        this.intakeData = data;
        this.updateChartData();
      },
      error: (err) => console.error('Failed to load intake data', err)
    });
  }

  updateChartData(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    this.chartData = {
      labels: [
        `🍗 Protéines`,
        `🥕 Légumes`,
        `🌾 Glucides`,
        `💧 Lipides`
      ],
      datasets: [{
          data: [
            this.proteinCount, 
            this.vegetableCount, 
            this.carbohydrateCount, 
            this.fatCount
          ],
          backgroundColor: [
              'rgba(239, 68, 68, 0.7)',   // Red-500
              'rgba(34, 197, 94, 0.7)',   // Green-500
              'rgba(245, 158, 11, 0.7)',  // Amber-500
              'rgba(59, 130, 246, 0.7)'   // Blue-500
          ],
          borderColor: [
              'rgb(239, 68, 68)',
              'rgb(34, 197, 94)',
              'rgb(245, 158, 11)',
              'rgb(59, 130, 246)'
          ],
          borderWidth: 2
      }]
    };

    this.options = {
      plugins: { legend: { labels: { color: textColor } } },
      scales: { r: { grid: { color: surfaceBorder } } }
    };
  }

  onWeekChanged(event: WeekRangeEvent): void {
    this.currentStartDate = event.startDate;
    this.currentEndDate = event.endDate;
    this.selectedDay = event.days.find(d => d.isToday) || event.days[0];
    this.loadMeals();
  }

  onDaySelectFromCalendar(day: WeekDayContext): void {
    this.selectedDay = day;
  }
    
  onHouseholdMemberSelected(householdMember: HouseholdMember | null){
    this.selectedMember = householdMember;
    this.updateChartData(); 
  }

  // --- Photo Viewer Logic ---
  openImageViewer(imageUrl: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.viewerImageUrl = imageUrl;
    this.displayImageViewer = true;
  }

  // --- Dialog & Form Logic ---

  openAddMealDialog(mealType: FoodIntakeMealType, event: Event) {
    event.preventDefault();
    if (!this.selectedMember || !this.selectedMember.id) return;

    this.isEditMode = false;
    const targetDate = this.selectedDay ? this.selectedDay.isoDate : this.datePipe.transform(new Date(), 'yyyy-MM-dd')!;

    this.editingMeal = {
      date: targetDate,
      assigneeId: this.selectedMember.id, 
      mealType: mealType,
      description: '',
      porteinPortion: 0.0,
      vegetablePortion: 0.0,
      carbohydratePortion: 0.0,
      fatPortion: 0.0,
      imageUrl: null
    };
    this.displayMealDialog = true;
  }

  openEditMealDialog(meal: FoodIntakeUnit) {
    this.isEditMode = true;
    this.editingMeal = { ...meal }; 
    this.displayMealDialog = true;
  }

  adjustPortion(macro: 'porteinPortion' | 'vegetablePortion' | 'carbohydratePortion' | 'fatPortion', delta: number) {
    const currentValue = this.editingMeal[macro] || 0;
    const newValue = currentValue + delta;
    if (newValue >= 0) {
      this.editingMeal[macro] = newValue;
    }
  }

  onImagePicked(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editingMeal.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(event: Event) {
    event.stopPropagation();
    this.editingMeal.imageUrl = null;
  }

  saveMeal() {
    this.foodIntakeService.saveIntakeUnit(this.editingMeal as FoodIntakeUnit).subscribe({
      next: () => {
        this.displayMealDialog = false;
        this.loadMeals();
      },
      error: (err) => console.error("Error saving meal:", err)
    });
  }

  deleteMeal() {
    if (this.editingMeal.id) {
      this.foodIntakeService.deleteIntakeUnit(this.editingMeal.id).subscribe({
        next: () => {
          this.displayMealDialog = false;
          this.loadMeals();
        },
        error: (err) => console.error("Error deleting meal:", err)
      });
    }
  }

  // --- Helper Methods for Template Display ---

  getMealsForDay(isoDate: string): FoodIntakeUnit[] {
    return this.filteredIntakeData.filter(meal => meal.date === isoDate);
  }

  getDailyTotals(meals: FoodIntakeUnit[]) {
    return meals.reduce((acc, curr) => {
      acc.protein += curr.porteinPortion;
      acc.vegetable += curr.vegetablePortion;
      acc.carbohydrate += curr.carbohydratePortion;
      acc.fat += curr.fatPortion;
      return acc;
    }, { protein: 0, vegetable: 0, carbohydrate: 0, fat: 0 });
  }

  getMealIcon(mealType: FoodIntakeMealType): string {
    switch(mealType) {
      case FoodIntakeMealType.BREAKFAST: return 'pi-sun text-orange-500';
      case FoodIntakeMealType.LUNCH: return 'pi-clock text-green-500';
      case FoodIntakeMealType.DINNER: return 'pi-moon text-indigo-500';
      case FoodIntakeMealType.SNACK: return 'pi-apple text-pink-500';
      default: return 'pi-calendar text-surface-500';
    }
  }
  
  getMealName(mealType: FoodIntakeMealType): string {
    switch(mealType) {
      case FoodIntakeMealType.BREAKFAST: return 'Déjeuner';
      case FoodIntakeMealType.LUNCH: return 'Dîner';
      case FoodIntakeMealType.DINNER: return 'Souper';
      case FoodIntakeMealType.SNACK: return 'Collation';
      default: return 'Repas';
    }
  }
}