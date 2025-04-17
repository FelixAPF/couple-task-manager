import { Component, EventEmitter, Input, Output, Inject, LOCALE_ID } from '@angular/core';
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
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [SharedModule, MyTasksComponent, WarningTasksDueComponent, CompletedTasksComponent, FormsModule, MealCardComponent, DatePipe],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
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

  hideCompletedTasks: boolean = false;
  collapseCompletedTasks: string = '0';
  todayMeal: Meal | undefined;
  subscription: Subscription = new Subscription();
  

  constructor(private taskService: TaskService, private mealService: MealService, private datePipe: DatePipe, @Inject(LOCALE_ID) private locale: string){}

  initializeStoredDescription(property: any, propertyName: string){
    const storedValue = localStorage.getItem(propertyName);
    if (storedValue !== null) {
      property = JSON.parse(storedValue);
    }
  }

  ngOnInit(): void {
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
          return 0; // Both are null, maintain original order
        }
        if (a.completedDate === null) {
          return -1; // a is null, place it before b
        }
        if (b.completedDate === null) {
          return 1; // b is null, place it before a
        }
      
        // Both are not null, compare dates
        return new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime(); // Oldest first
      });
    }));
  }

  
  retrieveTaskAssignmentsByDate(){
    this.subscription.add(this.taskService.getTaskAssignmentsByDate(this.todayDate).subscribe((taskAssignments) => {
      this.taskAssignments = taskAssignments;
    }));
  }


    

}
