import { Component, inject, LOCALE_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HouseholdMemberSelectorComponent } from '../shared/household-member-selector/household-member-selector.component';
import { HouseholdMember } from '../model/household';
import { SharedModule } from '../shared.module';
import { WeekDayContext, WeekNavigationControlComponent, WeekRangeEvent } from '../shared/week-navigation-control/week-navigation-control.component';
import { HouseholdService } from '../service/household.service';
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
  id: string; 
  date: string; 
  assigneeId: number; // Changed from string to number to match HouseholdMember.id
  description: string;
  mealType: FoodIntakeMealType;
  porteinPortion: number;
  vegetablePortion: number;
  testPortion: number;
  test2Portion: number;
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

  // Dialog State
  displayMealDialog: boolean = false;
  isEditMode: boolean = false;
  editingMeal: Partial<FoodIntakeUnit> = {};
  
  constructor(private datePipe: DatePipe, @Inject(LOCALE_ID) private locale: string) {}
  
  get filteredIntakeData() {
    if (!this.selectedMember || !this.selectedMember.id) return [];
    return this.intakeData.filter(m => m.assigneeId === this.selectedMember!.id);
  }

  get proteinCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.porteinPortion, 0); }
  get vegetableCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.vegetablePortion, 0); }
  get testCount() { return this.filteredIntakeData.reduce((prev, current) => prev + current.testPortion, 0); }
  get test2Count() { return this.filteredIntakeData.reduce((prev, current) => prev + current.test2Portion, 0); }
  
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
          
        this.generateMockData();
        this.updateChartData();
      } else { 
        this.householdMembersBirthdays = [];
      }
    });
  }

  private generateMockData(): void {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const todayIso = this.datePipe.transform(today, 'yyyy-MM-dd')!;
    const yesterdayIso = this.datePipe.transform(yesterday, 'yyyy-MM-dd')!;
    const tomorrowIso = this.datePipe.transform(tomorrow, 'yyyy-MM-dd')!;

    this.intakeData = [];

    this.householdMembers.forEach((member, index) => {
      if (!member.id) return;
      const mId = member.id;
      const modifier = index * 0.5; 

      this.intakeData.push(
        { id: `1_${mId}`, assigneeId: mId, date: yesterdayIso, description: "Bol de céréale, 1 pomme, 1 banane", mealType: FoodIntakeMealType.BREAKFAST, porteinPortion: 0, vegetablePortion: 2 + modifier, testPortion: 1, test2Portion: 0 },
        { id: `2_${mId}`, assigneeId: mId, date: yesterdayIso, description: "Bol de salade avec concombre, tomates et du poulet", mealType: FoodIntakeMealType.LUNCH, porteinPortion: 2 + modifier, vegetablePortion: 2, testPortion: 0.5, test2Portion: 1 },
        { id: `3_${mId}`, assigneeId: mId, date: yesterdayIso, description: "Steak saignant avec bacon enrobé, asperges", mealType: FoodIntakeMealType.DINNER, porteinPortion: 3, vegetablePortion: 3, testPortion: 1, test2Portion: 0 },
        { id: `4_${mId}`, assigneeId: mId, date: todayIso, description: "Crèpes nutella bananes", mealType: FoodIntakeMealType.BREAKFAST, porteinPortion: 0.5, vegetablePortion: 2, testPortion: 1, test2Portion: 1.5 },
        { id: `5_${mId}`, assigneeId: mId, date: todayIso, description: "Kraft Dinner Saucisse", mealType: FoodIntakeMealType.LUNCH, porteinPortion: 2, vegetablePortion: 0, testPortion: 0, test2Portion: 0 },
        { id: `6_${mId}`, assigneeId: mId, date: todayIso, description: "Poulet grillé avec riz et brocoli", mealType: FoodIntakeMealType.DINNER, porteinPortion: 3.5, vegetablePortion: 3 + modifier, testPortion: 1, test2Portion: 0 },
        { id: `7_${mId}`, assigneeId: mId, date: todayIso, description: "Yogourt grec et amandes", mealType: FoodIntakeMealType.SNACK, porteinPortion: 1.5, vegetablePortion: 0, testPortion: 0.5, test2Portion: 0 },
        { id: `8_${mId}`, assigneeId: mId, date: tomorrowIso, description: "Toast avocat et oeuf", mealType: FoodIntakeMealType.BREAKFAST, porteinPortion: 1, vegetablePortion: 1, testPortion: 0, test2Portion: 0 },
        { id: `9_${mId}`, assigneeId: mId, date: tomorrowIso, description: "Reste de poulet grillé", mealType: FoodIntakeMealType.LUNCH, porteinPortion: 3, vegetablePortion: 2.5, testPortion: 0, test2Portion: 0 }
      );
    });
  }

  updateChartData(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    this.chartData = {
      labels: ['Protéines', 'Légumes', 'Test', 'Test2'],
      datasets: [{
          data: [this.proteinCount, this.vegetableCount, this.testCount, this.test2Count]
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
  }

  onDaySelectFromCalendar(day: WeekDayContext): void {
    this.selectedDay = day;
  }
    
  onHouseholdMemberSelected(householdMember: HouseholdMember){
    this.selectedMember = householdMember;
    this.updateChartData(); 
  }

  // --- Dialog & Form Logic ---

  openAddMealDialog(mealType: FoodIntakeMealType, event: Event) {
    event.preventDefault();
    if (!this.selectedMember || !this.selectedMember.id) return;

    this.isEditMode = false;
    const targetDate = this.selectedDay ? this.selectedDay.isoDate : this.datePipe.transform(new Date(), 'yyyy-MM-dd')!;

    this.editingMeal = {
      id: Date.now().toString(), 
      date: targetDate,
      assigneeId: this.selectedMember.id, 
      mealType: mealType,
      description: '',
      porteinPortion: 0.0,
      vegetablePortion: 0.0,
      testPortion: 0.0,
      test2Portion: 0.0,
      imageUrl: null
    };
    this.displayMealDialog = true;
  }

  openEditMealDialog(meal: FoodIntakeUnit) {
    this.isEditMode = true;
    this.editingMeal = { ...meal }; 
    this.displayMealDialog = true;
  }

  adjustPortion(macro: 'porteinPortion' | 'vegetablePortion' | 'testPortion' | 'test2Portion', delta: number) {
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
    if (this.isEditMode) {
      const index = this.intakeData.findIndex(m => m.id === this.editingMeal.id);
      if (index !== -1) {
        this.intakeData[index] = this.editingMeal as FoodIntakeUnit;
      }
    } else {
      this.intakeData.push(this.editingMeal as FoodIntakeUnit);
    }
    
    this.intakeData = [...this.intakeData];
    this.updateChartData();
    this.displayMealDialog = false;
  }

  // --- Helper Methods for Template Display ---

  getMealsForDay(isoDate: string): FoodIntakeUnit[] {
    return this.filteredIntakeData.filter(meal => meal.date === isoDate);
  }

  getDailyTotals(meals: FoodIntakeUnit[]) {
    return meals.reduce((acc, curr) => {
      acc.protein += curr.porteinPortion;
      acc.vegetable += curr.vegetablePortion;
      acc.test += curr.testPortion;
      acc.test2 += curr.test2Portion;
      return acc;
    }, { protein: 0, vegetable: 0, test: 0, test2: 0 });
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