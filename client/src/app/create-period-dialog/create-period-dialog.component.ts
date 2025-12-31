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

// --- NEW IMPORTS ---
import { TaskListOccasionService } from '../service/task-list-occasion-service.service';
import { TaskListOccasion } from '../model/task-list-occasion';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';

enum FormControlName {
  DURATION = "duration",
  START_DATE = "startDate",
  CREATION_METHOD = "creationMethod",
  TASK_IDS = "taskIds",
  DURATION_TYPE = "durationType",
  EXPLICIT_DUE_DATE = "explicitDueDate",
  ASSIGNEE = "assignee",
}

export interface TaskWithAssignee {
  task: Task;
  assigneeUserId: number | null;
}

@Component({
  selector: 'app-create-period-dialog',
  standalone: true,
  imports: [
    SharedModule, 
    ReactiveFormsModule, 
    FormsModule, // Required for [(ngModel)]
    TaskAssignmentComponent,
    // Fix NG8002: Import PrimeNG modules here
    SelectButtonModule, 
    DropdownModule, 
    InputSwitchModule
  ],
  templateUrl: './create-period-dialog.component.html',
  styleUrls: ['./create-period-dialog.component.css'],
  providers: [DatePipe]
})
export class CreatePeriodDialogComponent implements OnInit {
  // Injected services
  private householdService = inject(HouseholdService);
  private fb = inject(FormBuilder);
  private taskPeriodService = inject(TaskPeriodService);
  private ref = inject(DynamicDialogRef);
  private datePipe = inject(DatePipe); 
  private taskService = inject(TaskService);
  public taskAssignmentService = inject(TaskAssignmentService); 
  private translate = inject(TranslateService);
  // NEW INJECTION
  private occasionService = inject(TaskListOccasionService);

  // Component State
  manualStepActivated: boolean = false;
  subscription: Subscription = new Subscription();
  existingTaskPeriods: TaskPeriod[] = [];
  assignees: HouseholdMember[] = [];
  frequencies: { label: string, value: Frequency }[];
  existingPeriodSelected: boolean = false;
  tasks: Task[] = [];
  taskAssignments: TaskWithAssignee[] = []; 

  // --- NEW STATE FOR OCCASION LOGIC ---
  creationSourceOptions = [
    { label: 'Liste', value: 'OCCASION', disabled: false },
    { label: 'Sélection manuelle', value: 'CUSTOM', disabled: true }
  ];
  selectedSource: string = 'OCCASION'; 
  occasions: TaskListOccasion[] = [];
  selectedOccasion: TaskListOccasion | null = null;
  autoCreateFromOccasion: boolean = true; 
  // ------------------------------------

  // Make enums available in template
  FREQUENCY = Frequency;
  CREATION_METHOD = CreationMethod;
  DURATION_TYPE = DurationType; 

  // Form Group Definition
  formGroup = this.fb.group({
    [FormControlName.DURATION]: [null as Frequency | null, []], 
    [FormControlName.START_DATE]: [new Date(), Validators.required],
    [FormControlName.CREATION_METHOD]: [CreationMethod.AUTOMATIC, Validators.required],
    [FormControlName.DURATION_TYPE]: [DurationType.PERIOD, Validators.required],
    [FormControlName.EXPLICIT_DUE_DATE]: [null as Date | null, []] 
  });

  constructor(){
      this.frequencies = Array.from(Object.values(Frequency)).map((frequency) => ({
        label: this.translate.instant(`FREQUENCY.${frequency}`), 
        value: frequency
      }));
   }

  // --- Getters ---
  get duration(){ return this.formGroup.get(FormControlName.DURATION) as FormControl<Frequency | null>; }
  get startDate(){ return this.formGroup.get(FormControlName.START_DATE) as FormControl<Date>; }
  get creationMethod(){ return this.formGroup.get(FormControlName.CREATION_METHOD) as FormControl<CreationMethod>; }
  get durationType(){ return this.formGroup.get(FormControlName.DURATION_TYPE) as FormControl<DurationType>; }
  get explicitDueDate(){ return this.formGroup.get(FormControlName.EXPLICIT_DUE_DATE) as FormControl<Date | null>; }
  get isAutomaticCreation() { return this.creationMethod?.value === CreationMethod.AUTOMATIC; }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    // Load existing incomplete periods
    this.taskPeriodService.retrieveTaskPeriodsIncomplete().subscribe(periods => {
      this.existingTaskPeriods = periods;
    });

    // Subscribe to household changes
    this.subscription.add(this.householdService.household$.subscribe((household) => {
      this.assignees = household?.members || [];
    }));

    // NEW: Load Occasions
    this.occasionService.list().subscribe(occasions => {
        this.occasions = occasions;
        if(this.occasions.length > 0) {
            this.selectedOccasion = this.occasions[0];
        }
    });

    // Initialize Validators
    this.updateValidators(this.durationType.value);

    // Subscribe to DurationType changes
    this.subscription.add(
        this.durationType.valueChanges.subscribe(type => {
            this.updateValidators(type);
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // REQUIRED BY TEMPLATE (Fixing NG9 error)
  dummyCallback = () => {
    // Callback logic is handled by activateSecondFormGroup internals setting manualStepActivated = true
  };

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

  // --- NEW: Toggle Logic ---
  toggleOccasionAutoCreate(isAuto: boolean) {
      this.autoCreateFromOccasion = isAuto;
      if (isAuto) {
          this.creationMethod.setValue(CreationMethod.AUTOMATIC);
      } else {
          this.creationMethod.setValue(CreationMethod.MANUAL);
      }
  }
  
  // NEW: Reset logic when switching Main Modes (Fixing NG9 error 'onModeChange does not exist')
  onModeChange() {
      this.autoCreateFromOccasion = true;
      if(this.selectedSource === 'OCCASION') {
        this.creationMethod.setValue(CreationMethod.AUTOMATIC);
      } else {
        this.creationMethod.setValue(CreationMethod.MANUAL);
      }
      this.onOccasionChange(); // Re-trigger filter if needed
  }
  
  // Also needed for dropdown change
  onOccasionChange() {
      // Any logic needed when occasion changes (e.g. updating info text)
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

    // NEW: If "From Template" AND "Auto Create" are ON, we don't go to manual step.
    if (this.selectedSource === 'OCCASION' && this.autoCreateFromOccasion && this.selectedOccasion) {
        this.submit(); // Direct submit with undefined manual data
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

      // --- NEW LOGIC: Filter tasks if using Occasion Mode ---
      if (this.selectedSource === 'OCCASION' && this.selectedOccasion) {
          const occasionTaskIds = this.selectedOccasion.taskAssignments.map(ta => ta.task.id!);
          this.tasks = this.tasks.filter(t => occasionTaskIds.includes(t.id!));
      }
      // -----------------------------------------------------

      this.taskAssignments = this.tasks.map(task => ({
        assigneeUserId: null, 
        task
      }));
      
      this.taskAssignmentService.setTaskAssignments(this.taskAssignments);
    });
  }

  // Changed type to 'any' to avoid strict template check error 'NG5'
  submit(manualAssignmentData?: any): void { 
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
        return;
    }

    const formValue = this.formGroup.getRawValue(); 

    const result: PeriodCreationRequest = {
      periodId: null, 
      duration: formValue[FormControlName.DURATION]!, 
      startDate: formValue[FormControlName.START_DATE]!, 
      explicitDueDate: formValue[FormControlName.DURATION_TYPE] === DurationType.EXPLICIT
                        ? formValue[FormControlName.EXPLICIT_DUE_DATE]
                        : null, 
      creationMethod: formValue[FormControlName.CREATION_METHOD]!, 
      taskAssignmentRqst: manualAssignmentData?.taskWithAssignees?.map(
          (taskWithAssignee: TaskWithAssignee) => ({
              taskId: taskWithAssignee.task.id!,
              assigneeUserId: taskWithAssignee.assigneeUserId
          })
      ) || [], 
      createEachTaskOnce: manualAssignmentData?.createEachOnce || false 
    };

    // --- NEW LOGIC ---
    if (this.selectedSource === 'OCCASION' && this.autoCreateFromOccasion && this.selectedOccasion) {
        // Option 1: Occasion Auto-Create
        this.taskPeriodService.startPeriodFromTaskListOccasion(result, this.selectedOccasion.id)
            .subscribe({
                next: () => this.close(true),
                error: () => this.close(false)
            });
    } else {
        // Option 2: Generic Create
        this.taskPeriodService.initiateCreatePeriod(result).subscribe({
            next: () => this.close(true),
            error: () => this.close(false)
        });
    }
  }

  close(success: boolean | any = false): void {
    this.ref.close(success);
  }
}