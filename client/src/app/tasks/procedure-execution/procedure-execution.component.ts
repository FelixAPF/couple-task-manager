import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TaskService } from '../../service/task-service.service';
import { Task } from '../../model/task';
import { ProcedureStep } from '../../model/procedure';

interface ExecutableStep extends ProcedureStep {
    state: 'IDLE' | 'PROCESSING' | 'COMPLETED';
}

@Component({
  selector: 'app-procedure-execution',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './procedure-execution.component.html',
  styleUrls: ['./procedure-execution.component.css']
})
export class ProcedureExecutionComponent implements OnInit {
    task!: Task;
    assigneeId!: number;
    steps: ExecutableStep[] = [];
    currentStepIndex: number = 0;
    isFinished: boolean = false;

    constructor(
        private ref: DynamicDialogRef,
        private config: DynamicDialogConfig,
        private taskService: TaskService
    ) {}

    ngOnInit() {
        this.task = this.config.data.task;
        this.assigneeId = this.config.data.assigneeId;
        
        if (this.task.procedure && this.task.procedure.steps) {
            this.steps = this.task.procedure.steps
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map(s => ({ ...s, state: 'IDLE' }));
        }
    }

    completeCurrentStep() {
        if (this.currentStepIndex >= this.steps.length) return;
        
        const step = this.steps[this.currentStepIndex];
        step.state = 'PROCESSING';

        setTimeout(() => {
            step.state = 'COMPLETED';
            
            setTimeout(() => {
                this.currentStepIndex++;
                if (this.currentStepIndex >= this.steps.length) {
                    this.finalizeTask();
                }
            }, 1400); 

        }, 600); 
    }

    finalizeTask() {
        this.isFinished = true;
        this.taskService.quickComplete(this.task.id!, this.assigneeId).subscribe({
            next: () => {
            },
            error: (err) => {
                console.error('Error completing task via procedure', err);
            }
        });
    }

    close() {
        this.ref.close(this.isFinished);
    }

    cancel() {
        this.ref.close(false);
    }
}