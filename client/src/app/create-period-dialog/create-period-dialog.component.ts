import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared.module';
import { CreationMethod, Frequency, Task } from '../model/task';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskPeriodService } from '../service/task-period.service';
import { Assignee, BasicTaskAssignmentRqst, DurationType, PeriodCreationRequest, TaskAssignment, TaskPeriod } from '../model/task-period';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { DatePipe, DatePipeConfig } from '@angular/common';
import { TaskLink } from '../model/local-model';
import { TaskService } from '../service/task-service.service';
import { TaskAssignmentComponent, TasksInputParameter } from "../tasks/task-assignment/task-assignment.component";
import { TaskAssignmentService } from '../service/task-assignment.service';
import { PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Platform } from '@angular/cdk/platform';
import { TranslateService } from '@ngx-translate/core';
import { HouseholdService } from '../service/household.service';
import { Subscription } from 'rxjs';
import { HouseholdMember } from '../model/household';

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
  imports: [SharedModule, ReactiveFormsModule, TaskAssignmentComponent],
  templateUrl: './create-period-dialog.component.html',
  styleUrl: './create-period-dialog.component.css',
  providers: [DatePipe]
})
export class CreatePeriodDialogComponent implements OnInit {
  // Injected services
  private householdService = inject(HouseholdService);
  private fb = inject(FormBuilder);
  private taskPeriodService = inject(TaskPeriodService);
  private ref = inject(DynamicDialogRef);
  private datePipe = inject(DatePipe); // Keep if used
  private taskService = inject(TaskService);
  public taskAssignmentService = inject(TaskAssignmentService); // Make public if accessed in template
  private translate = inject(TranslateService);

  // Component State
  manualStepActivated: boolean = false;
  subscription: Subscription = new Subscription();
  existingTaskPeriods: TaskPeriod[] = [];
  assignees: HouseholdMember[] = [];
  frequencies: { label: string, value: Frequency }[];
  existingPeriodSelected: boolean = false;
  tasks: Task[] = [];
  taskAssignments: TaskWithAssignee[] = []; // Used for manual assignment step

  // Make enums available in template
  FREQUENCY = Frequency;
  CREATION_METHOD = CreationMethod;
  DURATION_TYPE = DurationType; // Use the imported enum

  // Form Group Definition
  formGroup = this.fb.group({
    [FormControlName.DURATION]: [null as Frequency | null, []], // Initial validator set in ngOnInit
    [FormControlName.START_DATE]: [new Date(), Validators.required],
    [FormControlName.CREATION_METHOD]: [CreationMethod.AUTOMATIC, Validators.required],
    // [FormControlName.TASK_IDS]: [[]], // Consider if this is needed or handled by taskAssignments
    [FormControlName.DURATION_TYPE]: [DurationType.PERIOD, Validators.required],
    [FormControlName.EXPLICIT_DUE_DATE]: [null as Date | null, []] // Initial validator set in ngOnInit, initialize as null
  });

  constructor(){
      // Initialize frequencies using translate service
      this.frequencies = Array.from(Object.values(Frequency)).map((frequency) => ({
        label: this.translate.instant(`FREQUENCY.${frequency}`), // Ensure translations exist
        value: frequency
      }));
   }

  // --- Getters for Template Access ---
  get duration(){ return this.formGroup.get(FormControlName.DURATION) as FormControl<Frequency | null>; }
  get startDate(){ return this.formGroup.get(FormControlName.START_DATE) as FormControl<Date>; }
  get creationMethod(){ return this.formGroup.get(FormControlName.CREATION_METHOD) as FormControl<CreationMethod>; }
  get durationType(){ return this.formGroup.get(FormControlName.DURATION_TYPE) as FormControl<DurationType>; }
  get explicitDueDate(){ return this.formGroup.get(FormControlName.EXPLICIT_DUE_DATE) as FormControl<Date | null>; }
  // get taskIds(){ return this.formGroup.get(FormControlName.TASK_IDS) } // Uncomment if needed
  get isAutomaticCreation() { return this.creationMethod?.value === CreationMethod.AUTOMATIC; }

  // --- Lifecycle Hooks ---
  ngOnInit(): void {
    // Load existing incomplete periods for potential selection (if applicable)
    this.taskPeriodService.retrieveTaskPeriodsIncomplete().subscribe(periods => {
      this.existingTaskPeriods = periods;
    });

    // Subscribe to household changes to get assignees
    this.subscription.add(this.householdService.household$.subscribe((household) => {
      this.assignees = household?.members || [];
    }));

    // --- Initialize Validators based on default DurationType ---
    this.updateValidators(this.durationType.value);

    // --- Subscribe to DurationType changes to update validators dynamically ---
    this.subscription.add(
        this.durationType.valueChanges.subscribe(type => {
            this.updateValidators(type);
        })
    );
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }

  // --- Core Logic for Dynamic Validation ---
  private updateValidators(type: DurationType | null): void {
    const durationControl = this.duration; // Use getter
    const explicitDueDateControl = this.explicitDueDate; // Use getter

    if (!durationControl || !explicitDueDateControl) {
      console.error('Form controls not found during validator update.');
      return;
    }

    // Clear existing validators and reset values for the controls that will be hidden/inactive
    durationControl.clearValidators();
    durationControl.reset(null, { emitEvent: false }); // Reset without triggering valueChanges again

    explicitDueDateControl.clearValidators();
    explicitDueDateControl.reset(null, { emitEvent: false }); // Reset without triggering valueChanges again

    // Set validators based on the selected type
    if (type === DurationType.PERIOD) { // Use imported DurationType
      durationControl.setValidators(Validators.required);
    } else if (type === DurationType.EXPLICIT) { // Use imported DurationType
      explicitDueDateControl.setValidators(Validators.required);
    }

    // Update the validity state of the controls after changing validators
    durationControl.updateValueAndValidity({ emitEvent: false });
    explicitDueDateControl.updateValueAndValidity({ emitEvent: false });

    // Optional: Update the overall form validity if needed immediately
    // this.formGroup.updateValueAndValidity();
  }

  // --- Event Handlers & Actions ---

  // Called when selecting an existing period (if that feature is used)
  disableOtherFields(event: any): void {
    this.existingPeriodSelected = event.value !== null;
    if (this.existingPeriodSelected) {
      this.duration?.disable();
      this.startDate?.disable();
      // Potentially disable other fields relevant only to new periods
    } else {
      this.duration?.enable();
      this.startDate?.enable();
      // Re-enable fields
    }
    // May need to re-evaluate validators if disabled fields had them
    this.formGroup.updateValueAndValidity();
  }

  // Called by the "Next" button to go to manual assignment step
  // Called by the "Next" button to go to manual assignment step
  activateSecondFormGroup(activateCallback: () => void): void { // <-- Accept the callback function
    this.formGroup.markAllAsTouched(); // Mark fields to show errors if invalid
    if (!this.formGroup.valid) {
        console.warn("Form is invalid. Cannot proceed to manual assignment.");
        return; // Don't proceed if form is invalid
    }
    this.retrieveTasksForAssignment(); // Load tasks for the next step
    this.manualStepActivated = true;
    activateCallback(); // <-- Call the stepper's callback to move to the next step
  }


  // Called by the "Cancel" button in the manual assignment step
  handleManualCancel(): void {
    this.manualStepActivated = false;
    // Clear any state related to manual assignment if necessary
    this.taskAssignments = [];
  }

  // Fetches tasks to be shown in the manual assignment component
  retrieveTasksForAssignment(): void {
    this.taskService.retrieveTasks().subscribe(tasks => {
      this.tasks = tasks;
      // Initialize TaskWithAssignee structure for the assignment component
      this.taskAssignments = this.tasks.map(task => ({
        assigneeUserId: null, // Default to unassigned
        task
      }));
      // Pass this data to the service or directly to the child component
      this.taskAssignmentService.setTaskAssignments(this.taskAssignments);
    });
  }

  // Final submission logic
  submit(manualAssignmentData?: { taskWithAssignees: TaskWithAssignee[], createEachOnce: boolean }): void {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
        console.error('Form is invalid:', this.formGroup.errors);
        // Optionally show a user-facing error message (e.g., Toast)
        return;
    }

    const formValue = this.formGroup.getRawValue(); // Use getRawValue if fields might be disabled

    const result: PeriodCreationRequest = {
      periodId: null, // Assuming always creating new, adjust if editing existing
      duration: formValue[FormControlName.DURATION]!, // Should be valid if form is valid for PERIOD type
      startDate: formValue[FormControlName.START_DATE]!, // Should always be valid
      explicitDueDate: formValue[FormControlName.DURATION_TYPE] === DurationType.EXPLICIT
                       ? formValue[FormControlName.EXPLICIT_DUE_DATE]
                       : null, // Only include if type is EXPLICIT
      creationMethod: formValue[FormControlName.CREATION_METHOD]!, // Should always be valid
      taskAssignmentRqst: manualAssignmentData?.taskWithAssignees?.map(
          (taskWithAssignee: TaskWithAssignee) => ({
              taskId: taskWithAssignee.task.id,
              assigneeUserId: taskWithAssignee.assigneeUserId
          })
      ) || [], // Use data from manual step if provided
      createEachTaskOnce: manualAssignmentData?.createEachOnce || false // Use flag from manual step
    };

    // Clean up duration if type is EXPLICIT before sending
    if (result.explicitDueDate) {
        // The backend might not expect duration if explicitDueDate is set
        // Adjust based on your API contract. Setting to a default or removing might be needed.
        // For now, we keep it as is, assuming the backend handles it.
        // If needed: delete (result as any).duration; or result.duration = someDefault;
    }


    console.log("Submitting Period Creation Request:", result);
    this.taskPeriodService.initiateCreatePeriod(result).subscribe({
        next: () => {
            console.log("Period creation successful");
            this.close(true); // Close dialog and indicate success
        },
        error: (err) => {
            console.error("Error creating period:", err);
            // Optionally show a user-facing error message
            this.close(false); // Close dialog and indicate failure (optional)
        }
    });
  }

  // Closes the dialog, optionally returning a result
  close(success: boolean | any = false): void {
    this.ref.close(success);
  }
}
