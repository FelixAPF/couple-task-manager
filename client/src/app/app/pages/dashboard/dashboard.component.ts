import { Component, EventEmitter, Input, Output, Inject, LOCALE_ID, computed, inject } from '@angular/core';
import { TaskService } from '../../../service/task-service.service';
import { SharedModule } from '../../../shared.module';
import { MyTasksComponent } from '../../../tasks/my-tasks/my-tasks.component';
import { WarningTasksDueComponent } from "../../../warning-tasks-due/warning-tasks-due.component";
import { Task, TaskWithCompletedDate } from '../../../model/task';
import { CompletedTasksComponent } from "../../../tasks/completed-tasks/completed-tasks.component";
import { TaskAssignment, TaskAssignmentDto } from '../../../model/task-period';
import { FormsModule } from '@angular/forms';
import { Meal } from '../../../model/meals';
import { MealService } from '../../../service/meal.service';
import { Subscription } from 'rxjs';
import { MealCardComponent } from '../../../meal-planning/meal-card/meal-card.component';
import { DatePipe, CommonModule } from '@angular/common';
import { BalloonContainerComponent } from '../../../container/balloon-container/balloon-container.component';
import { HouseholdService } from '../../../service/household.service';
import { FinanceService } from '../../../service/finance.service'; // <-- IMPORT THIS
import { RouterModule } from '@angular/router'; // <-- IMPORT THIS

export function areTwoFullDatesEqual(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getDate() === date2.getDate();
}

export function areTwoDatesEqual(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() && 
         date1.getDate() === date2.getDate();
}

@Component({
  selector: 'app-dashboard',
  imports: [SharedModule, MyTasksComponent, WarningTasksDueComponent, CompletedTasksComponent, FormsModule, MealCardComponent, CommonModule, RouterModule],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  providers: [DatePipe]
})
export class DashboardComponent {

  expiredTasks: TaskWithCompletedDate[] = [];
  tasks: Task[] = [];
  completedTasks: TaskAssignment[] = [];
  taskAssignments: TaskAssignmentDto[] = [];
  todayDate: Date = new Date();
  todayNormalizedDate: Date = new Date();
  formattedTodayDate: string = '';
  isTodayBirthday: boolean = false;

  hideCompletedTasks: boolean = false;
  collapseCompletedTasks: string = '0';
  todayMeal: Meal | undefined;
  subscription: Subscription = new Subscription();
  
  // --- NEW: Finance Services and Computed Signals ---
  private financeService = inject(FinanceService);

  currentGroceryBalance = computed(() => this.financeService.groceryFund()?.balance || 0);

  grocerySpentThisMonth = computed(() => {
    const txs = this.financeService.groceryTransactions();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return txs
      .filter(tx => {
        const txDate = new Date(tx.date);
        return tx.transactionType === 'SPEND' &&
               txDate.getMonth() === currentMonth &&
               txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  });

  constructor(private taskService: TaskService, private householdService: HouseholdService, private mealService: MealService, private datePipe: DatePipe, @Inject(LOCALE_ID) private locale: string){}

  initializeStoredDescription(property: any, propertyName: string){
    const storedValue = localStorage.getItem(propertyName);
    if (storedValue !== null) {
      property = JSON.parse(storedValue);
    }
  }

  ngOnInit(): void {
    // --- NEW: Load finance data on init ---
    this.financeService.loadFinanceData();
    // ---------------------------------------

    this.todayNormalizedDate.setHours(0, 0, 0, 0);
    this.formattedTodayDate = this.datePipe.transform(this.todayNormalizedDate, 'EEEE d MMMM', this.locale) || '';
    this.formattedTodayDate = this.formattedTodayDate.charAt(0).toUpperCase() + this.formattedTodayDate.slice(1);

    const storedHideCompletedTasks = localStorage.getItem("hideCompletedTasks");
    if (storedHideCompletedTasks !== null) {
      this.hideCompletedTasks = JSON.parse(storedHideCompletedTasks);
    }
    
    const storedCollapseCompletedTasks = localStorage.getItem("collapseCompletedTasks");
    if (storedCollapseCompletedTasks !== null) {
      this.collapseCompletedTasks = JSON.parse(storedCollapseCompletedTasks) ? '0' : '1';
    }    

    if(!this.hideCompletedTasks) {
      this.retrieveTaskAssignmentsByDate();
    }

    this.retrieveExpiredTasks();
    this.retrieveTodayMeal();

    this.subscription.add(this.householdService.getHouseholdMembersBirthdays().subscribe((birthdays) => {
      this.isTodayBirthday = birthdays.some(birthday => { 
        if(!birthday) return false; 
        const birthdayDate = new Date(birthday);
        return areTwoDatesEqual(birthdayDate, this.todayDate);
      });
    }));
  }

  retrieveTodayMeal(): void {
    this.subscription.add(this.mealService.getMealByDate(this.todayNormalizedDate).subscribe(meal => {
      this.todayMeal = meal;
    }));
  }

  saveHideStorage(arg0: string,arg1: boolean) {
    localStorage.setItem(arg0, arg1.toString());
  }
  
  onHideCompletedTasks(value: any){
    this.hideCompletedTasks = value.checked;
    localStorage.setItem("hideCompletedTasks", this.hideCompletedTasks.toString());

    if(!this.hideCompletedTasks){
      this.retrieveTaskAssignmentsByDate();
    } else {
      this.taskAssignments = [];
    }
  }

  refreshExpiredTasks(taskId: number){ 
    const isTaskExpired = this.tasks.find(t => t.id === taskId) !== undefined; 
    
    if(isTaskExpired){
      this.retrieveExpiredTasks();
    }
    this.retrieveTaskAssignmentsByDate();
    return;
  }

  retrieveExpiredTasks(){
    this.subscription.add(this.taskService.retrieveTasksNotDoneInLongTime().subscribe(tasks => {
      this.tasks = tasks.map(task => task.task);
      this.expiredTasks = tasks.sort((a: TaskWithCompletedDate, b: TaskWithCompletedDate) => {
        if (a.completedDate === null && b.completedDate === null) {
          return 0; 
        }
        if (a.completedDate === null) {
          return -1; 
        }
        if (b.completedDate === null) {
          return 1; 
        }
        return new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime(); 
      });
    }));
  }
  
  retrieveTaskAssignmentsByDate(){
    this.subscription.add(this.taskService.getTaskAssignmentsByDate(this.todayDate).subscribe((taskAssignments) => {
      this.taskAssignments = taskAssignments;
    }));
  }
}