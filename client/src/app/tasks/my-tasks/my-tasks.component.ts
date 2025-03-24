import { Component, inject, OnInit } from '@angular/core';
import { Assignee, TaskAssignment } from '../../model/task-period';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { Frequency, Task } from '../../model/task';
import { Subscription } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { TaskPeriodService } from '../../service/task-period.service';
import { TaskListService } from '../../service/task-list.service';
import { CreatePeriodDialogComponent } from '../../create-period-dialog/create-period-dialog.component';
import { SelectChangeEvent } from 'primeng/select';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

enum FormControlName {
  DISPLAY_DURATION = 'displayDuration'
}
@Component({
  selector: 'app-my-tasks',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss',
  providers: [DialogService]
})
export class MyTasksComponent implements OnInit {
  DISPLAY_DURATION = FormControlName;
  fb:FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({ [FormControlName.DISPLAY_DURATION]: [Frequency.MONTHLY] });
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
    const frequency = this.formGroup.get(FormControlName.DISPLAY_DURATION)?.value || Frequency.MONTHLY;
    this.subscription.add(this.taskService.retrieveTaskByAssignee(this.selectedAssignee, frequency).subscribe(taskAssignments => {
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
      width: '30vw',
      height: '700px',
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

  get options(){
    return [
      { label: 'Semaine', value: Frequency.WEEKLY},
      { label: 'Deux semaines', value: Frequency.BIWEEKLY},
      { label: 'Mois', value: Frequency.MONTHLY},
      { label: 'Année', value: Frequency.YEARLY}
    ]
  }

  
  get displayDuration(){
    return this.formGroup.get(FormControlName.DISPLAY_DURATION);
  }

  onChange($event: SelectChangeEvent) {
    this.retrieveTaskByAssignee();
  }
    
}
