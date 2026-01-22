import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared.module';
import { CreationMethod, Frequency, Task } from '../model/task';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskPeriodService } from '../service/task-period.service';
import { Assignee, BasicTaskAssignmentRqst, DurationType, PeriodCreationRequest, TaskAssignment, TaskPeriod } from '../model/task-period';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { DatePipe } from '@angular/common';
import { TaskService } from '../service/task-service.service';
import { TaskAssignmentComponent, TasksInputParameter } from "../tasks/task-assignment/task-assignment.component";
import { TaskAssignmentService } from '../service/task-assignment.service';
import { TranslateService } from '@ngx-translate/core';
import { HouseholdService } from '../service/household.service';
import { Subscription } from 'rxjs';
import { HouseholdMember } from '../model/household';

// PrimeNG Imports
import { TaskListOccasionService } from '../service/task-list-occasion-service.service';
import { TaskListOccasion } from '../model/task-list-occasion';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

enum FormControlName {
  DURATION = "duration",
  START_DATE = "startDate",
  CREATION_METHOD = "creationMethod",
  TASK_IDS = "taskIds",
  DURATION_TYPE = "durationType",
  EXPLICIT_DUE_DATE = "explicitDueDate",
  ASSIGNEE = "assignee",
  CREATE_ONCE = "createOnce",
}

export interface TaskWithAssignee {
  task: Task;
  assigneeUserId: number | null;
}

@Component({
  selector: 'app-create-period-dialog',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    TaskAssignmentComponent,
    SelectButtonModule,
    DropdownModule,
    InputSwitchModule,
    CalendarModule,
    ButtonModule
  ],
  templateUrl: './create-period-dialog.component.html',
  styleUrls: ['./create-period-dialog.component.css'],
  providers: [DatePipe]
})
export class CreatePeriodDialogComponent implements OnInit {
  private householdService = inject(HouseholdService);
  private fb = inject(FormBuilder);
  private taskPeriodService = inject(TaskPeriodService);
  private ref = inject(DynamicDialogRef);
  private datePipe = inject(DatePipe);
  private taskService = inject(TaskService);
  public taskAssignmentService = inject(TaskAssignmentService);
  private translate = inject(TranslateService);
  private occasionService = inject(TaskListOccasionService);

  manualStepActivated: boolean = false;
  subscription: Subscription = new Subscription();
  existingTaskPeriods: TaskPeriod[] = [];
  assignees: HouseholdMember[] = [];
  frequencies: { label: string, value: Frequency }[];
  existingPeriodSelected: boolean = false;
  tasks: Task[] = [];
  taskAssignments: TaskWithAssignee[] = [];

  creationSourceOptions = [
    { label: 'Liste', value: 'OCCASION', disabled: false },
    { label: 'Sélection manuelle', value: 'CUSTOM', disabled: false }
  ];
  selectedSource: string = 'OCCASION';
  occasions: TaskListOccasion[] = [];
  selectedOccasion: TaskListOccasion | null = null;
  autoCreateFromOccasion: boolean = true;

  FREQUENCY = Frequency;
  CREATION_METHOD = CreationMethod;
  DURATION_TYPE = DurationType;

  formGroup = this.fb.group({
    [FormControlName.DURATION]: [null as Frequency | null, []],
    [FormControlName.START_DATE]: [new Date(), Validators.required],
    [FormControlName.CREATION_METHOD]: [CreationMethod.AUTOMATIC, Validators.required],
    [FormControlName.DURATION_TYPE]: [DurationType.PERIOD, Validators.required],
    [FormControlName.EXPLICIT_DUE_DATE]: [null as Date | null, []],
    [FormControlName.CREATE_ONCE]: [false] // Added default off
  });

  constructor(){
      this.frequencies = Array.from(Object.values(Frequency)).map((frequency) => ({
        label: this.translate.instant(`FREQUENCY.${frequency}`),
        value: frequency
      }));
   }

  get duration(){ return this.formGroup.get(FormControlName.DURATION) as FormControl<Frequency | null>; }
  get startDate(){ return this.formGroup.get(FormControlName.START_DATE) as FormControl<Date>; }
  get creationMethod(){ return this.formGroup.get(FormControlName.CREATION_METHOD) as FormControl<CreationMethod>; }
  get durationType(){ return this.formGroup.get(FormControlName.DURATION_TYPE) as FormControl<DurationType>; }
  get explicitDueDate(){ return this.formGroup.get(FormControlName.EXPLICIT_DUE_DATE) as FormControl<Date | null>; }
  get createOnce(){ return this.formGroup.get(FormControlName.CREATE_ONCE) as FormControl<boolean>; } // Added getter
  get isAutomaticCreation() { return this.creationMethod?.value === CreationMethod.AUTOMATIC; }

  ngOnInit(): void {
    this.taskPeriodService.retrieveTaskPeriodsIncomplete().subscribe(periods => {
      this.existingTaskPeriods = periods;
    });

    this.subscription.add(this.householdService.household$.subscribe((household) => {
      this.assignees = household?.members || [];
    }));

    this.occasionService.list().subscribe(occasions => {
        this.occasions = occasions;
        if(this.occasions.length > 0) {
            this.selectedOccasion = this.occasions[0];
        }
    });

    this.updateValidators(this.durationType.value);

    this.subscription.add(
        this.durationType.valueChanges.subscribe(type => {
            this.updateValidators(type);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  dummyCallback = () => {};

  private updateValidators(type: DurationType | null): void {
    const durationControl = this.duration;
    const explicitDueDateControl = this.explicitDueDate;

    if (!durationControl || !explicitDueDateControl) return;

    durationControl.clearValidators();
    durationControl.reset(null, { emitEvent: false });

    explicitDueDateControl.clearValidators();
    explicitDueDateControl.reset(null, { emitEvent: false });

    if (type === DurationType.PERIOD) {
      durationControl.setValidators(Validators.required);
    } else if (type === DurationType.EXPLICIT) {
      explicitDueDateControl.setValidators(Validators.required);
    }

    durationControl.updateValueAndValidity({ emitEvent: false });
    explicitDueDateControl.updateValueAndValidity({ emitEvent: false });
  }

  toggleOccasionAutoCreate(isAuto: boolean) {
      this.autoCreateFromOccasion = isAuto;
      if (isAuto) {
          this.creationMethod.setValue(CreationMethod.AUTOMATIC);
      } else {
          this.creationMethod.setValue(CreationMethod.MANUAL);
      }
  }

  onModeChange() {
      this.autoCreateFromOccasion = true;
      if(this.selectedSource === 'OCCASION') {
        this.creationMethod.setValue(CreationMethod.AUTOMATIC);
      } else {
        this.creationMethod.setValue(CreationMethod.MANUAL);
      }
      this.onOccasionChange();
  }

  onOccasionChange() {
      // Stub
  }

  disableOtherFields(event: any): void {
    this.existingPeriodSelected = event.value !== null;
    if (this.existingPeriodSelected) {
      this.duration?.disable();
      this.startDate?.disable();
    } else {
      this.duration?.enable();
      this.startDate?.enable();
    }
    this.formGroup.updateValueAndValidity();
  }

  activateSecondFormGroup(activateCallback: () => void): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
        console.warn("Form is invalid.");
        return;
    }

    if (this.selectedSource === 'OCCASION' && this.autoCreateFromOccasion && this.selectedOccasion) {
        this.submit();
        return;
    }

    this.retrieveTasksForAssignment();
    this.manualStepActivated = true;
    if(activateCallback) activateCallback();
  }

  handleManualCancel(): void {
    this.manualStepActivated = false;
    this.taskAssignments = [];
  }

  retrieveTasksForAssignment(): void {
    this.taskService.retrieveTasks().subscribe(tasks => {
      this.tasks = tasks;

      if (this.selectedSource === 'OCCASION' && this.selectedOccasion) {
          const occasionTaskIds = this.selectedOccasion.taskAssignments.map(ta => ta.task.id!);
          this.tasks = this.tasks.filter(t => occasionTaskIds.includes(t.id!));
      }

      this.taskAssignments = this.tasks.map(task => ({
        assigneeUserId: null,
        task
      }));

      this.taskAssignmentService.setTaskAssignments(this.taskAssignments);
      this.manualStepActivated = true;
    });
  }

  submit(manualAssignmentData?: any): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
        console.error("Form is invalid", this.formGroup.errors);
        return;
    }

    const formValue = this.formGroup.getRawValue();

    const assignmentsSource = manualAssignmentData?.taskWithAssignees || this.taskAssignments;

    const result: PeriodCreationRequest = {
      periodId: null,
      duration: formValue[FormControlName.DURATION]!,
      startDate: formValue[FormControlName.START_DATE]!,
      explicitDueDate: formValue[FormControlName.DURATION_TYPE] === DurationType.EXPLICIT
                        ? formValue[FormControlName.EXPLICIT_DUE_DATE]
                        : null,
      creationMethod: formValue[FormControlName.CREATION_METHOD]!,

      taskAssignmentRqst: assignmentsSource.map(
          (taskWithAssignee: TaskWithAssignee) => ({
              taskId: taskWithAssignee.task.id!,
              assigneeUserId: taskWithAssignee.assigneeUserId
          })
      ),

      // Updated to use the form control value
      createEachTaskOnce: formValue[FormControlName.CREATE_ONCE] || manualAssignmentData?.createEachOnce || false
    };


    if (this.selectedSource === 'OCCASION' && this.autoCreateFromOccasion && this.selectedOccasion) {
        this.taskPeriodService.startPeriodFromTaskListOccasion(result, this.selectedOccasion.id)
            .subscribe({
                next: () => this.close(true),
                error: (err) => { console.error(err); this.close(false); }
            });
    } else {
        this.taskPeriodService.initiateCreatePeriod(result).subscribe({
            next: () => this.close(true),
            error: (err) => { console.error(err); this.close(false); }
        });
    }
  }

  close(success: boolean | any = false): void {
    this.ref.close(success);
  }
}
