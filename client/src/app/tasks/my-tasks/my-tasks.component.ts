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
import { ReassignTaskDialogComponent } from '../reassign-task/reassign-task.component';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TaskAssignmentService } from '../../service/task-assignment.service';

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
  imports: [SharedModule, ContextMenuModule, ConfirmDialogModule, ReactiveFormsModule, RoomPipe, InputTextModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.css',
  providers: [{provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: {dateFormat: 'longDate'}}, ConfirmationService, MessageService]
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
  ignoreNextClick = false;
  selectedAssignee: HouseholdMember | null = null;

  menuItems: MenuItem[] = [];
  selectedTaskAssignment: TaskAssignmentDto | null = null;

  get displayDuration(){
    return this.formGroup.get(FormControlName.DISPLAY_DURATION);
  }

  constructor(private taskService: TaskService, private taskAssignmentService: TaskAssignmentService, private confirmationService: ConfirmationService, private messageService: MessageService, private translate: TranslateService, private householdService: HouseholdService, public dialog: DialogService, private taskPeriodService: TaskPeriodService, private taskListService: TaskListService){}


  ngOnInit(): void {
    this.householdService.retrieveHousehold().subscribe(household => {
      this.householdMembers = household?.members || [];
      this.selectedAssigneeId = household?.currentUser.id || 0;
      this.selectedAssignee = household?.currentUser || null;
      this.retrieveTaskByAssignee();
    });

    this.menuItems = [
      {
        label: 'Transférer à quelqu\'un d\'autre',
        icon: 'pi pi-arrow-right-arrow-left',
        command: () => {
          if (this.selectedTaskAssignment) {
            this.openReassignDialog(this.selectedTaskAssignment);
          }
        }
      },
      {
        label: 'Supprimer',
        icon: 'pi pi-times-circle',
        command: () => {
          if (this.selectedTaskAssignment) {
            this.deleteTaskAssignment(this.selectedTaskAssignment);
          }
        }
      }
    ];
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

  deleteTaskAssignment(assignment: TaskAssignmentDto){
    if(!assignment) return;
    console.log("DELETING")

    this.confirmationService.confirm({
                message: 'Do you want to delete this record?',
                header: 'Danger Zone',
                icon: 'pi pi-info-circle',
                rejectLabel: 'Cancel',
                rejectButtonProps: {
                    label: 'Cancel',
                    severity: 'secondary',
                    outlined: true
                },
                acceptButtonProps: {
                    label: 'Delete',
                    severity: 'danger'
                },

                accept: () => {
                  this.taskAssignmentService.deleteTaskAssignment(assignment.id).subscribe(() => {
                    this.retrieveTaskByAssignee();
                  })
                    this.messageService.add({ severity: 'danger', summary: 'Confirmed', detail: 'Assignation supprimée' });
                },
                reject: () => {
                    this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
                }
            });
    }

onTaskMenu(event: any, task: TaskAssignmentDto, contextMenu: any) {
    this.selectedTaskAssignment = task;

    if (event.type === 'contextmenu') {
      event.preventDefault();
      event.stopPropagation();
      contextMenu.show(event);
      return;
    }

    if (event.type === 'press') {
      // Set the flag to ignore the subsequent 'release' click
      this.ignoreNextClick = true;

      if (event.srcEvent) {
          event.srcEvent.preventDefault();
          event.srcEvent.stopPropagation();
      }

      const x = event.center.x;
      const y = event.center.y;
      const syntheticEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          buttons: 2
      });
      contextMenu.show(syntheticEvent);
    }
  }

  onCardClick(event: any) {
    if (this.ignoreNextClick) {
      event.preventDefault();
      event.stopPropagation();
      this.ignoreNextClick = false; // Reset flag
    }
  }

  // 4. Add this method as a safety reset (in case user drags off and click never fires)
  onCardPointerUp() {
    if (this.ignoreNextClick) {
        setTimeout(() => {
            this.ignoreNextClick = false;
        }, 500);
    }
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

  openReassignDialog(taskAssignment: TaskAssignmentDto) {
    const ref = this.dialog.open(ReassignTaskDialogComponent, {
      header: 'Transférer la tâche',
      width: '90%',
      modal: true,
      dismissableMask: true,
      data: {
        members: this.householdMembers
      }
    });

    ref.onClose.subscribe((newAssignee: HouseholdMember) => {
      if (newAssignee) {
        this.subscription.add(
          this.taskAssignmentService.reassignTask(taskAssignment.id, newAssignee.id).subscribe(() => {
            this.retrieveTaskByAssignee(); // Refresh list
          })
        );
      }
    });
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
