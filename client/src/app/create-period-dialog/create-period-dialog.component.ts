import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../shared.module';
import { CreationMethod, Frequency } from '../model/task';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskPeriodService } from '../service/task-period.service';
import { PeriodCreationRequest, TaskPeriod } from '../model/task-period';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { DatePipe, DatePipeConfig } from '@angular/common';

enum FormControlName {
  DURATION = "duration",
  START_DATE = "startDate",
  CREATION_METHOD = "creationMethod",
  TASK_IDS = "taskIds",
  TASK_PERIOD = "taskPeriod",
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
    [FormControlName.TASK_PERIOD]: [null]
  })
  FREQUENCY = Frequency;
  CREATION_METHOD = CreationMethod;
  date: DatePipe
  existingPeriodSelected: boolean = false;

  get duration(){ return this.formGroup.get(FormControlName.DURATION) }
  get startDate(){ return this.formGroup.get(FormControlName.START_DATE) }
  get creationMethod(){ return this.formGroup.get(FormControlName.CREATION_METHOD) }
  get taskPeriod(){ return this.formGroup.get(FormControlName.TASK_PERIOD) }
  get taskIds(){ return this.formGroup.get(FormControlName.TASK_IDS) }
  get isAutomaticCreation() { return this.creationMethod?.value === CreationMethod.AUTOMATIC };

  get taskPeriods(){
    return this.existingTaskPeriods.map(({ id, startDate, endDate }) => {
      return ({
        label: `Période du ${this.datePipe.transform(startDate, 'longDate')} au ${this.datePipe.transform(endDate, 'longDate')}`,
        value: id
      })
    });
  }

  constructor(private taskPeriodService: TaskPeriodService, private ref: DynamicDialogRef, private datePipe: DatePipe ){}

  ngOnInit(): void {
    this.taskPeriodService.retrieveTaskPeriodsIncomplete().subscribe(periods => {
      this.existingTaskPeriods = periods;
    });
  }

  submit(){
    console.log("SUBMIT")
    const result:PeriodCreationRequest = {
      periodId: this.taskPeriod?.value || null,
      duration: this.duration?.value || Frequency.MONTHLY,
      startDate: this.startDate?.value || new Date(),
      creationMethod: this.creationMethod?.value || CreationMethod.AUTOMATIC,
      taskIds: this.taskIds?.value || []
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
}
