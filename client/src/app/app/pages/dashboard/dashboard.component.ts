import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskService } from '../../../service/task-service.service';
import { SharedModule } from '../../../shared.module';
import { MyTasksComponent } from '../../../tasks/my-tasks/my-tasks.component';
import { WarningTasksDueComponent } from "../../../warning-tasks-due/warning-tasks-due.component";
import { Task, TaskWithCompletedDate } from '../../../model/task';
import { CompletedTasksComponent } from "../../../tasks/completed-tasks/completed-tasks.component";
import { TaskAssignment } from '../../../model/task-period';

@Component({
  selector: 'app-dashboard',
  imports: [SharedModule, MyTasksComponent, WarningTasksDueComponent, CompletedTasksComponent],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  expiredTasks: TaskWithCompletedDate[] = [];
  tasks: Task[] = [];
  completedTasks: TaskAssignment[] = [];
  taskAssignments: TaskAssignment[] = [];
  todayDate: Date = new Date();

  constructor(private taskService: TaskService){}

  ngOnInit(): void {
    this.retrieveExpiredTasks();
    this.retrieveTaskAssignmentsByDate();
  }

  refreshExpiredTasks(taskId: number){ 
    const isTaskExpired = this.tasks.find(t => t.id === taskId) !== undefined; 
    
    if(isTaskExpired){
      this.retrieveExpiredTasks();
    }
    return;
  }

  retrieveExpiredTasks(){
    this.taskService.retrieveTasksNotDoneInLongTime().subscribe(tasks => {
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
    });
  }

  
  retrieveTaskAssignmentsByDate(){
    this.taskService.getTaskAssignmentsByDate(this.todayDate).subscribe((taskAssignments) => {
      this.taskAssignments = taskAssignments;
    });
  }


    

}
