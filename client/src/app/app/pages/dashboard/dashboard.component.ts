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
import { FinanceService } from '../../../service/finance.service';
import { RouterModule } from '@angular/router';
import { TravelService, Trip } from '../../../service/services/travel.service';
import { CountdownTimerComponent } from '../../../service/components/travel/countdown-timer/countdown-timer.component';

export function areTwoDatesEqual(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SharedModule,
    MyTasksComponent,
    WarningTasksDueComponent,
    CompletedTasksComponent,
    FormsModule,
    MealCardComponent,
    CommonModule,
    RouterModule,
    CountdownTimerComponent
  ],
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

  // --- Voyages & Compte à rebours ---
  private travelService = inject(TravelService);
  nextUpcomingTrip: Trip | null = null;

  // --- Finances ---
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

  constructor(
    private taskService: TaskService,
    private householdService: HouseholdService,
    private mealService: MealService,
    private datePipe: DatePipe,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.financeService.loadFinanceData();
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

    if (!this.hideCompletedTasks) {
      this.retrieveTaskAssignmentsByDate();
    }
    this.retrieveExpiredTasks();
    this.retrieveTodayMeal();
    this.retrieveNextUpcomingTrip();

    this.subscription.add(this.householdService.getHouseholdMembersBirthdays().subscribe((birthdays) => {
      this.isTodayBirthday = birthdays.some(birthday => {
        if (!birthday) return false;
        const birthdayDate = new Date(birthday);
        return areTwoDatesEqual(birthdayDate, this.todayDate);
      });
    }));
  }

  retrieveNextUpcomingTrip(): void {
    this.subscription.add(
      this.travelService.getTrips().subscribe({
        next: (trips: Trip[]) => {
          if (!trips || trips.length === 0) {
            this.nextUpcomingTrip = null;
            return;
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const futureTrips = trips
            .filter((t: Trip) => {
              if (!t.departureDate) return false;
              const cleanStr = typeof t.departureDate === 'string' ? t.departureDate.split('T')[0] : '';
              const [y, m, d] = cleanStr.split('-').map(Number);
              if (!y || !m || !d) return false;
              const tripDate = new Date(y, m - 1, d);
              tripDate.setHours(0, 0, 0, 0);
              return tripDate.getTime() >= today.getTime();
            })
            .sort((a: Trip, b: Trip) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime());

          this.nextUpcomingTrip = futureTrips.length > 0 ? futureTrips[0] : null;
        }
      })
    );
  }

  retrieveTodayMeal(): void {
    this.subscription.add(this.mealService.getMealByDate(this.todayNormalizedDate).subscribe(meal => {
      this.todayMeal = meal;
    }));
  }

  saveHideStorage(arg0: string, arg1: boolean) {
    localStorage.setItem(arg0, arg1.toString());
  }

  onHideCompletedTasks(value: any) {
    this.hideCompletedTasks = value.checked;
    localStorage.setItem("hideCompletedTasks", this.hideCompletedTasks.toString());
    if (!this.hideCompletedTasks) {
      this.retrieveTaskAssignmentsByDate();
    } else {
      this.taskAssignments = [];
    }
  }

  refreshExpiredTasks(taskId: number) {
    const isTaskExpired = this.tasks.find(t => t.id === taskId) !== undefined;
    if (isTaskExpired) {
      this.retrieveExpiredTasks();
    }
    this.retrieveTaskAssignmentsByDate();
  }

  retrieveExpiredTasks() {
    this.subscription.add(this.taskService.retrieveTasksNotDoneInLongTime().subscribe(tasks => {
      this.tasks = tasks.map(task => task.task);
      this.expiredTasks = tasks.sort((a: TaskWithCompletedDate, b: TaskWithCompletedDate) => {
        if (a.completedDate === null && b.completedDate === null) return 0;
        if (a.completedDate === null) return -1;
        if (b.completedDate === null) return 1;
        return new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime();
      });
    }));
  }

  retrieveTaskAssignmentsByDate() {
    this.subscription.add(this.taskService.getTaskAssignmentsByDate(this.todayDate).subscribe((taskAssignments) => {
      this.taskAssignments = taskAssignments;
    }));
  }
}