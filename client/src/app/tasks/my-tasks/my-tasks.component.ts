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
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';
import { TranslateService } from '@ngx-translate/core';

export const SourceMap = {
    [Assignee.Camille]: "assets/person2.jpg",
    [Assignee.Felix]: "assets/person1.jpg",
    [Assignee.Deux]: "assets/deux.jpg",
    [Assignee.Unassigned]: "assets/placeholder.jpg",
  }
    
enum FormControlName {
  DISPLAY_DURATION = 'displayDuration'
}
@Component({
  selector: 'app-my-tasks',
  imports: [SharedModule, ReactiveFormsModule, RoomPipe, InputTextModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css',
  providers: [{provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: {dateFormat: 'longDate'}}]
})
export class MyTasksComponent implements OnInit {
  DISPLAY_DURATION = FormControlName;
  fb:FormBuilder = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({ [FormControlName.DISPLAY_DURATION]: [Frequency.MONTHLY] });
  tasks: TaskAssignmentDto[] = [];
  subscription: Subscription = new Subscription();
  dataSource = new MatTableDataSource<TaskAssignment>();
  @Output() taskCompleteEmitter: EventEmitter<number> = new EventEmitter();
  
  assigneeOptions: any[] = [];
  readonly SOURCE_MAP = SourceMap;
  taskAssignments: TaskAssignment[] = [];
  householdMembers: HouseholdMember[] = [];
  today: any = new Date();
  hideCompletedTasks: boolean = false;
  selectedAssigneeId: number = 0;
  selectedAssignee: HouseholdMember | null = null;
  
  get displayDuration(){
    return this.formGroup.get(FormControlName.DISPLAY_DURATION);
  }

  constructor(private taskService: TaskService, private translate: TranslateService, private householdService: HouseholdService, public dialog: DialogService, private taskPeriodService: TaskPeriodService, private taskListService: TaskListService){}


  ngOnInit(): void {
    this.householdService.retrieveHousehold().subscribe(household => {
      console.log("Household retrieved:", household);
      this.householdMembers = household?.members || [];
      this.selectedAssigneeId = household?.currentUser.id || 0;
      this.selectedAssignee = household?.currentUser || null;
      this.retrieveTaskByAssignee();
    });

    

    const selectedFrequency = localStorage.getItem("myTasksFrequency") as Frequency;
    if(selectedFrequency != null){
      this.displayDuration?.setValue(selectedFrequency);
    } else {
      this.displayDuration?.setValue(Frequency.MONTHLY);
      this.setMyTaskFrequencyStorage(Frequency.MONTHLY);
    }


  }

  setMyTaskFrequencyStorage(frequency: Frequency){
    localStorage.setItem("myTasksFrequency", frequency);
  }

  changeUser(){
    const selectedAssigneeIndex = this.householdMembers.findIndex(member => member.id === this.selectedAssigneeId);
    if(selectedAssigneeIndex === -1 || selectedAssigneeIndex === this.householdMembers.length - 1){
      this.selectedAssignee = this.householdMembers[0];
    } else {
      this.selectedAssignee = this.householdMembers[selectedAssigneeIndex + 1];
    }
    this.selectedAssigneeId = this.selectedAssignee.id;
    
    this.retrieveTaskByAssignee();
  }

  retrieveTaskByAssignee(){
    const frequency = this.formGroup.get(FormControlName.DISPLAY_DURATION)?.value || Frequency.MONTHLY;
    this.subscription.add(this.taskService.retrieveTaskByAssignee(this.selectedAssigneeId, frequency).subscribe(taskAssignments => {
      this.tasks = taskAssignments.sort((a, b) => {
        // Create Date objects for reliable comparison
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();

        // Sort ascending (earliest date first)
        return dateA - dateB;
      });
    }))
  }

  completeTask(element: any){
    this.subscription.add(this.taskService.completeTask(element.id).subscribe(() => {
      this.retrieveTaskByAssignee();
      this.taskCompleteEmitter.emit(element.taskId);
    }));

  }

  quickComplete(){
    const ref = this.openDialog('Ajouter une tâche complétée', QuickCompleteTaskComponent, (value: any) => {
      this.taskCompleteEmitter.emit(value);
    });
  }

  openDialog(title: string, component: any, onCloseFn?: (retVal: any) => void) {
    const dialogRef = this.dialog.open(component, {
      header: title,
      width: '30vw',
      dismissableMask: true,
      modal:true,
      breakpoints: {
 '1199px': '75vw', '575px': '90vw'
      },
    });  
    dialogRef.onClose.subscribe((res) => {
      if (onCloseFn) {
        onCloseFn(res);
      }
      this.retrieveTaskByAssignee();
    })
  }

  startNewPeriod(){
    this.openDialog('Créer une nouvelle période', CreatePeriodDialogComponent);
  }

  get options(){
    return [
      { label: this.translate.instant('my-tasks.duration.weekly'), value: Frequency.WEEKLY},
      { label: this.translate.instant('my-tasks.duration.biweekly'), value: Frequency.BIWEEKLY},
      { label: this.translate.instant('my-tasks.duration.monthly'), value: Frequency.MONTHLY},
      { label: this.translate.instant('my-tasks.duration.yearly'), value: Frequency.YEARLY}
    ]
  }

  onFrequencySelectChange({value}: SelectChangeEvent) {
    this.setMyTaskFrequencyStorage(value);
    this.retrieveTaskByAssignee();
  }

  
  datePastDeadline(dueDate: any): boolean {
    return new Date(dueDate) < this.today;
  }

}
