import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ProcedureService } from '../../service/procedure.service';
import { Procedure } from '../../model/procedure';

@Component({
  selector: 'app-procedure-dialog',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './procedure-dialog.component.html'
})
export class ProcedureDialogComponent implements OnInit {
  formGroup: FormGroup;
  isEditMode: boolean = false;
  procedureId?: number;

  constructor(
    private fb: FormBuilder,
    private ref: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private procedureService: ProcedureService
  ) {
    this.formGroup = this.fb.group({
      name: ['', Validators.required],
      steps: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const procData: Procedure = this.config.data?.procedure;
    if (procData) {
      this.isEditMode = true;
      this.procedureId = procData.id;
      this.formGroup.patchValue({ name: procData.name });
      
      if (procData.steps) {
        const sortedSteps = [...procData.steps].sort((a, b) => a.stepOrder - b.stepOrder);
        sortedSteps.forEach(step => {
          this.steps.push(this.createStepGroup(step.description, step.id, step.stepOrder));
        });
      }
    } else {
      this.addStep(); // Give them one empty step to start
    }
  }

  get steps(): FormArray {
    return this.formGroup.get('steps') as FormArray;
  }

  createStepGroup(description: string = '', id: number | null = null, stepOrder: number | null = null): FormGroup {
    return this.fb.group({
      id: [id],
      description: [description, Validators.required],
      stepOrder: [stepOrder || this.steps.length + 1]
    });
  }

  addStep(): void {
    this.steps.push(this.createStepGroup());
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
    this.updateStepOrders();
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      const step = this.steps.at(index);
      this.steps.removeAt(index);
      this.steps.insert(index - 1, step);
      this.updateStepOrders();
    }
  }

  moveStepDown(index: number): void {
    if (index < this.steps.length - 1) {
      const step = this.steps.at(index);
      this.steps.removeAt(index);
      this.steps.insert(index + 1, step);
      this.updateStepOrders();
    }
  }

  updateStepOrders(): void {
    this.steps.controls.forEach((control, index) => {
      control.get('stepOrder')?.setValue(index + 1);
    });
  }

  save(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const procedure: Procedure = {
      id: this.procedureId,
      name: this.formGroup.value.name,
      steps: this.formGroup.value.steps
    };

    if (this.isEditMode && this.procedureId) {
      this.procedureService.updateProcedure(this.procedureId, procedure).subscribe(() => {
        this.ref.close(true);
      });
    } else {
      this.procedureService.createProcedure(procedure).subscribe(() => {
        this.ref.close(true);
      });
    }
  }

  cancel(): void {
    this.ref.close(false);
  }
}