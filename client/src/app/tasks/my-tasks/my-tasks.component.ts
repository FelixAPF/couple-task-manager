import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Assignee, TaskAssignment, TaskAssignmentDto } from '../../model/task-period';
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
import { RoomPipe } from '../../shared/pipes/room-pipe';
import { InputTextModule } from 'primeng/inputtext';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { QuickCompleteTaskComponent } from '../quick-complete-task/quick-complete-task.component';

enum FormControlName {
  DISPLAY_DURATION = 'displayDuration'
}
@Component({
  selector: 'app-my-tasks',
  imports: [SharedModule, ReactiveFormsModule, RoomPipe, InputTextModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css',
  providers: [DialogService,   {provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: {dateFormat: 'longDate', locale: 'fr'}}]
})
export class MyTasksComponent implements OnInit {
  DISPLAY_DURATION = FormControlName;
  fb:FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({ [FormControlName.DISPLAY_DURATION]: [Frequency.MONTHLY] });
  tasks: TaskAssignmentDto[] = [];
  subscription: Subscription = new Subscription();
  dataSource = new MatTableDataSource<TaskAssignment>();
  @Output() taskCompleteEmitter: EventEmitter<number> = new EventEmitter();
  
  selectedAssignee: Assignee = Assignee.Camille;
  taskAssignments: TaskAssignment[] = [];
  today: any = new Date();
  hideCompletedTasks: boolean = false;

  constructor(private taskService: TaskService, public dialog: DialogService, private taskPeriodService: TaskPeriodService, private taskListService: TaskListService){}


  ngOnInit(): void {
    this.selectedAssignee = localStorage.getItem("assignee") as Assignee;
    if(this.selectedAssignee == null){
      this.selectedAssignee = Assignee.Camille;
      localStorage.setItem("assignee", this.selectedAssignee);
    }
    this.retrieveTaskByAssignee();
  }

  changeUser(){
    this.selectedAssignee = this.selectedAssignee === Assignee.Camille ? Assignee.Felix : Assignee.Camille;
    this.retrieveTaskByAssignee();
    localStorage.setItem("assignee", this.selectedAssignee);
  }

  retrieveTaskByAssignee(){
    const frequency = this.formGroup.get(FormControlName.DISPLAY_DURATION)?.value || Frequency.MONTHLY;
    this.subscription.add(this.taskService.retrieveTaskByAssignee(this.selectedAssignee, frequency).subscribe(taskAssignments => {
      this.tasks = taskAssignments.map(({ assignee, creationDate, dueDate, taskTitle, taskDescription, id, taskPeriodId, completed, room, taskId }) => ({
        assignee, creationDate, dueDate, taskTitle, taskDescription, id, completed, taskPeriodId, room: room, taskId
      }));
    }))
  }

  completeTask(element: any){
    this.taskService.quickComplete(13, Assignee.Camille).subscribe();
    this.subscription.add(this.taskService.completeTask(element.id).subscribe(() => {
      this.retrieveTaskByAssignee();
      this.taskCompleteEmitter.emit(element.taskId);
    }));

  }

  quickComplete(){
    this.openDialog('Ajouter une tâche complétée', QuickCompleteTaskComponent);
  }

  openDialog(title: string, component: any){
    const dialogRef = this.dialog.open(component, {
      header: title,
      width: '30vw',
      dismissableMask: true,
      modal:true,
      breakpoints: {
 '1199px': '75vw', '575px': '90vw'
      },
    });  
    dialogRef.onClose.subscribe(() => {
      this.retrieveTaskByAssignee();
    })
  }

  startNewPeriod(){
    this.openDialog('Créer une nouvelle période', CreatePeriodDialogComponent);
    
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

  
  datePastDeadline(dueDate: any): boolean {
    return new Date(dueDate) < this.today;
  }
    
}
