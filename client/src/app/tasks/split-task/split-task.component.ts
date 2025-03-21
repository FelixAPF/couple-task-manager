import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { TaskAssignmentDialogComponent } from '../task-assignment-dialog/task-assignment-dialog.component';
import { TaskPeriodService } from '../../service/task-period.service';
import { Subscription } from 'rxjs';
import { Assignee, TaskPeriod } from '../../model/task-period';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-split-task',
  imports: [SharedModule],
  templateUrl: './split-task.component.html',
  styleUrl: './split-task.component.scss',
  providers:[DialogService]
})
export class SplitTaskComponent implements OnInit {
  taskPeriods: TaskPeriod[] = [];
  ref: DynamicDialogRef | undefined;

  subscription: Subscription = new Subscription();
  constructor(public dialog: DialogService, private taskPeriodService: TaskPeriodService){}

  copainTasks(taskPeriodId: number | undefined){
    const taskPeriod = this.taskPeriods.find((taskPeriod) => taskPeriod.id === taskPeriodId);
    if(taskPeriod === undefined) return [];

    return taskPeriod.taskAssignments?.filter((assignment) => assignment.assignee === Assignee.Felix);

  }

  copineTasks(taskPeriodId: number | undefined){
    const taskPeriod = this.taskPeriods.find((taskPeriod) => taskPeriod.id === taskPeriodId);
    if(taskPeriod === undefined) return [];

    return taskPeriod.taskAssignments?.filter((assignment) => assignment.assignee === Assignee.Camille);

  }

  ngOnInit(): void {
    this.retrieveTaskPeriods();
  }

  retrieveTaskPeriods(){
    this.subscription.add(this.taskPeriodService.retrieveTaskPeriods().subscribe(
      (taskPeriods) => this.taskPeriods = taskPeriods
    ));
  }

  create(){
    const dialogRef = this.dialog.open(TaskAssignmentDialogComponent, {
      header: 'Select a Product',
      width: '50vw',
      modal:true,
      breakpoints: {
          '960px': '75vw',
          '640px': '90vw'
      },
  });

  
  }

  deletePeriod(id?: number){
    this.taskPeriodService.deleteTaskPeriod(id).subscribe(() => this.retrieveTaskPeriods());
  }
}
