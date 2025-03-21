import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { TaskAssignmentDialogComponent } from '../task-assignment-dialog/task-assignment-dialog.component';
import { TaskPeriodService } from '../../service/task-period.service';
import { Subscription } from 'rxjs';
import { Assignee, TaskPeriod } from '../../model/task-period';
import { DialogService } from 'primeng/dynamicdialog';
import { TaskListService } from '../../service/task-list.service';
import { TaskList } from '../../model/task-list';
import { DialogRef } from '@angular/cdk/dialog';
import { Task } from '../../model/task';

@Component({
  selector: 'app-split-task',
  imports: [SharedModule],
  templateUrl: './split-task.component.html',
  styleUrl: './split-task.component.scss',
  providers:[DialogService]
})
export class SplitTaskComponent implements OnInit {
  taskPeriods: TaskPeriod[] = [];

  subscription: Subscription = new Subscription();
  taskLists: TaskList[] = [];
  tasksCopine: Task[] = [];
  tasksCopain: Task[] = [];
  constructor(public dialog: DialogService, private taskPeriodService: TaskPeriodService, private taskListService: TaskListService){}

  ngOnInit(): void {
    this.retrieveTasks();
  }

  retrieveTasks(){
    this.subscription.add(this.taskListService.retrieveTaskList(Assignee.Felix).subscribe((taskList) => {
      this.tasksCopain = taskList?.tasks;
    }))

    this.subscription.add(this.taskListService.retrieveTaskList(Assignee.Camille).subscribe((taskList) => {
      this.tasksCopine = taskList?.tasks;
    }))
  }

  create(){
    const dialogRef = this.dialog.open(TaskAssignmentDialogComponent, {
      width: '50vw',
      dismissableMask: true,
      modal:true,
      breakpoints: {
          '960px': '75vw',
          '640px': '90vw'
      },
    });
  }
}
