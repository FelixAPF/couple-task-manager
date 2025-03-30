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
import { AssigneeTaskListComponent } from "./assignee-task-list/assignee-task-list.component";

@Component({
  selector: 'app-split-task',
  imports: [SharedModule, AssigneeTaskListComponent],
  templateUrl: './split-task.component.html',
  styleUrl: './split-task.component.css',
  providers:[DialogService]
})
export class SplitTaskComponent implements OnInit {
  subscription: Subscription = new Subscription();
  taskLists: TaskList[] = [];
  tasksCopine?: TaskList;
  tasksCopain?: TaskList;
  constructor(public dialog: DialogService, private taskPeriodService: TaskPeriodService, private taskListService: TaskListService){}

  ngOnInit(): void {
    this.retrieveTasks();
  }

  retrieveTasks(){
    this.subscription.add(this.taskListService.retrieveTaskList(Assignee.Felix).subscribe((taskList) => {
      this.tasksCopain = taskList;
    }))

    this.subscription.add(this.taskListService.retrieveTaskList(Assignee.Camille).subscribe((taskList) => {
      this.tasksCopine = taskList;
    }))
  }

  unassign(value: any){
    console.log("JUST EMITTED")
    const { element, taskList } = value;
    this.taskListService.deleteTaskList({ taskListId: taskList?.id, assignee: taskList?.assignee, taskId: element.id }).subscribe(resp => {
      switch(taskList?.assignee){
        case Assignee.Felix: 
          this.tasksCopain = resp;
          break;
        case Assignee.Camille:
          this.tasksCopine = resp;
          break;
      }
    });
  }

  create(){
    const dialogRef = this.dialog.open(TaskAssignmentDialogComponent, {
      header: 'Assigner des tâches',
      width: '30vw',
      dismissableMask: true,
      modal:true,
      breakpoints: {
 '1199px': '75vw', '575px': '90vw'
      },
    });  

    dialogRef.onClose.subscribe((taskPeriod: TaskPeriod) => {
      this.retrieveTasks();
    });
  }
}
