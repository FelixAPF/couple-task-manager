import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared.module';
import { CreationMethod, Frequency, Task } from '../model/task';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskPeriodService } from '../service/task-period.service';
import { Assignee, BasicTaskAssignmentRqst, DurationType, PeriodCreationRequest, TaskPeriod } from '../model/task-period';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { DatePipe, DatePipeConfig } from '@angular/common';
import { TaskLink } from '../model/local-model';
import { TaskService } from '../service/task-service.service';

enum FormControlName {
  DURATION = "duration",
  START_DATE = "startDate",
  CREATION_METHOD = "creationMethod",
  TASK_IDS = "taskIds",
  TASK_PERIOD = "taskPeriod",
  DURATION_TYPE = "durationType",
  EXPLICIT_DUE_DATE = "explicitDueDate",
  ASSIGNEE = "assignee",
  TASK_ASSIGNMENTS = "taskAssignments",
  CREATE_EACH_TASK_ONCE = "createEachTaskOnce"
}

enum AssignmentRow {
  TASK_ID = "taskId",
  TASK_TITLE = "title",
  TASK_DESCRIPTION = "description",
  ASSIGNEE = "assignee",
  SELECTED = "selected",
}

interface TaskWithAssignee {
  task: Task;
  assignee: Assignee | null;
}

@Component({
  selector: 'app-create-period-dialog',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './create-period-dialog.component.html',
  styleUrl: './create-period-dialog.component.scss',
  providers: [DatePipe]
})
export class CreatePeriodDialogComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  existingTaskPeriods: TaskPeriod[] = [];
  formGroup = this.fb.group({
    [FormControlName.DURATION]: [null, Validators.required],
    [FormControlName.START_DATE]: [new Date(), Validators.required],
    [FormControlName.CREATION_METHOD]: [CreationMethod.AUTOMATIC, Validators.required],
    [FormControlName.TASK_IDS]: [[]],
    [FormControlName.TASK_PERIOD]: [null],
    [FormControlName.DURATION_TYPE]: [DurationType.PERIOD, Validators.required],
    [FormControlName.EXPLICIT_DUE_DATE]: [new Date(), []]
  })
  secondFormGroup = this.fb.group({
    [FormControlName.TASK_ASSIGNMENTS]: this.fb.array([]),
    [FormControlName.CREATE_EACH_TASK_ONCE]: [false, []]
  });
  ASSIGNEE = Assignee;
  FREQUENCY = Frequency;
  CREATION_METHOD = CreationMethod;
  DURATION_TYPE = DurationType;
  date: DatePipe
  existingPeriodSelected: boolean = false;
  tasks: Task[] = [];

  get duration(){ return this.formGroup.get(FormControlName.DURATION) }
  get startDate(){ return this.formGroup.get(FormControlName.START_DATE) }
  get creationMethod(){ return this.formGroup.get(FormControlName.CREATION_METHOD) }
  get durationType(){ return this.formGroup.get(FormControlName.DURATION_TYPE) }
  get createEachTaskOnce(){ return this.secondFormGroup.get(FormControlName.CREATE_EACH_TASK_ONCE) }
  get explicitDueDate(){ return this.formGroup.get(FormControlName.EXPLICIT_DUE_DATE) }
  get taskPeriod(){ return this.formGroup.get(FormControlName.TASK_PERIOD) }
  get taskIds(){ return this.formGroup.get(FormControlName.TASK_IDS) }
  get isAutomaticCreation() { return this.creationMethod?.value === CreationMethod.AUTOMATIC };
  get taskAssignments() { return this.secondFormGroup.get(FormControlName.TASK_ASSIGNMENTS) as FormArray };

  get taskPeriods(){
    return this.existingTaskPeriods.map(({ id, startDate, endDate }) => {
      return ({
        label: `Période du ${this.datePipe.transform(startDate, 'longDate')} au ${this.datePipe.transform(endDate, 'longDate')}`,
        value: id
      })
    });
  }

  constructor(private taskPeriodService: TaskPeriodService, private ref: DynamicDialogRef, private datePipe: DatePipe, private taskService: TaskService ){}

  ngOnInit(): void {
    this.taskPeriodService.retrieveTaskPeriodsIncomplete().subscribe(periods => {
      this.existingTaskPeriods = periods;
    });
  }

    patchValues(taskLink: TaskWithAssignee) {
      return this.fb.group({
        [AssignmentRow.TASK_TITLE]: [taskLink?.task.title || ""],
        [AssignmentRow.TASK_DESCRIPTION]: [taskLink?.task.description || ""],
        [AssignmentRow.TASK_ID]: [taskLink?.task.id],
        [AssignmentRow.ASSIGNEE]: [taskLink?.assignee || null]
      })    
    }

    getFormControl(index: number, controlName: string): FormControl {
      const control = this.taskAssignments.at(index).get(controlName);
      return control as FormControl;
    }
  submit(){
    const result:PeriodCreationRequest = {
      periodId: this.taskPeriod?.value || null,
      duration: this.duration?.value || Frequency.MONTHLY,
      startDate: this.startDate?.value || new Date(),
      creationMethod: this.creationMethod?.value || CreationMethod.AUTOMATIC,
      taskAssignmentRqst: this.taskAssignments?.value.filter((taskAssignment: { task: Task, assignee: Assignee}) => taskAssignment?.assignee !== null)
              .map((taskAssignment: { task: Task, assignee: Assignee}) => ({taskId: taskAssignment.task.id, assignee: taskAssignment.assignee })) || [],
      explicitDueDate: this.durationType?.value ? this.explicitDueDate?.value : null,
      createEachTaskOnce: this.createEachTaskOnce?.value || false
    }
    
    this.taskPeriodService.initiateCreatePeriod(result).subscribe(() => {
      this.close();
    });
  }

  disableOtherFields(event: any) {
    this.existingPeriodSelected = event.value !== null;
    if(this.existingPeriodSelected){
      this.formGroup.get(FormControlName.DURATION)?.disable();
      this.formGroup.get(FormControlName.START_DATE)?.disable();
    } else {
      this.formGroup.get(FormControlName.DURATION)?.enable();
      this.formGroup.get(FormControlName.START_DATE)?.enable();
    }
  }

  close(){
    this.ref.close();
  }

  retrieveTaskPeriod() {
    this.taskService.retrieveTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.tasks.forEach(task => {
        this.taskAssignments.push(this.fb.group({
          task,
          assignee: null
        }))
      });
    });
    
  }

  onDurationTypeChange(){
    if(this.durationType?.value === DurationType.EXPLICIT){
      this.formGroup.get(FormControlName.EXPLICIT_DUE_DATE)?.setValidators([Validators.required]);
      this.formGroup.get(FormControlName.DURATION)?.clearValidators();
    } else {
      this.formGroup.get(FormControlName.EXPLICIT_DUE_DATE)?.clearValidators();
      this.formGroup.get(FormControlName.DURATION)?.setValidators([Validators.required]);
    }
  }

  activateSecondFormGroup(activateCallback: any, ){
    this.retrieveTaskPeriod();
    activateCallback(2);
  }
}
