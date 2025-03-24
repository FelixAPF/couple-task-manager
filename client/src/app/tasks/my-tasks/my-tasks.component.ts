import { Component, OnInit } from '@angular/core';
import { Assignee, TaskAssignment } from '../../model/task-period';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { Task } from '../../model/task';
import { Subscription } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { TaskPeriodService } from '../../service/task-period.service';
import { TaskListService } from '../../service/task-list.service';
import { CreatePeriodDialogComponent } from '../../create-period-dialog/create-period-dialog.component';

@Component({
  selector: 'app-my-tasks',
  imports: [SharedModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss',
  providers: [DialogService]
})
export class MyTasksComponent implements OnInit {
  tasks: Task[] = [];
  subscription: Subscription = new Subscription();
  displayedColumns = [ "title", "description", "dueDate", "complete"]
  dataSource = new MatTableDataSource<TaskAssignment>();
  
  selectedAssignee: Assignee = Assignee.Camille;
  taskAssignments: TaskAssignment[] = [];
  constructor(private taskService: TaskService, public dialog: DialogService, private taskPeriodService: TaskPeriodService, private taskListService: TaskListService){}


  ngOnInit(): void {
    this.retrieveTaskByAssignee();
  }

  changeUser(){
    this.selectedAssignee = this.selectedAssignee === Assignee.Camille ? Assignee.Felix : Assignee.Camille;
    this.retrieveTaskByAssignee();
  }

  retrieveTaskByAssignee(){
    this.subscription.add(this.taskService.retrieveTaskByAssignee(this.selectedAssignee).subscribe(taskAssignments => {
      this.tasks = taskAssignments.map(({ assignee, creationDate, dueDate, task, id, period }) => ({
        assignee, creationDate, dueDate, task, id, period
      }));
      this.taskAssignments = taskAssignments;
    }))
  }

  completeTask(elementId: number){
    this.subscription.add(this.taskService.completeTask(elementId).subscribe(() => {
      this.retrieveTaskByAssignee();
    }));
  }

  startNewPeriod(){
    const dialogRef = this.dialog.open(CreatePeriodDialogComponent, {
      header: 'Créer une période de tâches',
      width: '50vw',
      height: '500px',
      dismissableMask: true,
      modal:true,
      breakpoints: {
          '960px': '75vw',
          '640px': '90vw'
      },
    });  
    dialogRef.onClose.subscribe(() => {
      this.retrieveTaskByAssignee();
    })
  }
    
}
