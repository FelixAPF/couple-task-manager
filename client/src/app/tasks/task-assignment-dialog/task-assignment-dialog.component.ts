import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Task } from '../../model/task';
import { TaskService } from '../../service/task-service.service';
import { TaskPeriodService } from '../../service/task-period.service';
import { TaskAssignment, TaskPeriod } from '../../model/task-period';
import { DialogService } from 'primeng/dynamicdialog';

enum FormControlName {
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  TASK_ASSIGNMENTS = 'taskAssignments'
}

enum AssignmentRow {
  TASK_ID = "taskId",
  TASK_TITLE = "title",
  ASSIGNEE = "assignee"
}

@Component({
  selector: 'app-task-assignment-dialog',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './task-assignment-dialog.component.html',
  styleUrl: './task-assignment-dialog.component.scss',
  providers: [ provideNativeDateAdapter(), DialogService ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAssignmentDialogComponent {
  fb = inject(FormBuilder);
  subscription: Subscription = new Subscription();
  activeStep: number = 1;
  tasks: Task[] = [];
  displayedColumns = ["title", "assignment"]

  firstFormGroup = this.fb.group({
    [FormControlName.START_DATE]: [new Date() || null],
    [FormControlName.END_DATE]: [new Date(), [Validators.required]],
  });
  secondFormGroup = this.fb.group({
    [FormControlName.TASK_ASSIGNMENTS]: this.fb.array([]),  
  });
AssignmentRow = AssignmentRow;

  get taskAssignments(): FormArray {
    return this.secondFormGroup.get(FormControlName.TASK_ASSIGNMENTS) as FormArray;
  }

  constructor(public dialogService: DialogService,private taskService: TaskService, private taskPeriodService: TaskPeriodService) {    
    this.loadTasks();
  }

  
  
  loadTasks(){
    this.subscription.add(this.taskService.retrieveTasks().subscribe(tasks => {
      const assignments: TaskAssignment[] = tasks.map((task) => ({
        task,
        assignee: null,
        dueDate: null,
        creationDate: new Date()
      }))
      console.log(this.secondFormGroup.controls);
      const formArray = this.secondFormGroup.get(FormControlName.TASK_ASSIGNMENTS) as FormArray; // Get FormArray reference
      assignments.forEach(assignment => formArray.push(this.patchValues(assignment))); // Use formArray reference
      
      console.log("TASKS", tasks);
      console.log("FORM GROUP", this.secondFormGroup);
      this.tasks = tasks
    }));
     
  }

  patchValues(assignment: TaskAssignment) {
    return this.fb.group({
      [AssignmentRow.TASK_TITLE]: [assignment.task.title || ""],
      [AssignmentRow.TASK_ID]: [assignment.task.id],
      [AssignmentRow.ASSIGNEE]: [assignment.assignee]
    })    
  }

  generateTaskPeriodFromForm(): TaskPeriod {
    const assignments = this.taskAssignments?.value as any[];
    const taskPeriod: TaskPeriod = {
      endDate: this.firstFormGroup.get(FormControlName.END_DATE)?.value as Date,
      startDate: this.firstFormGroup.get(FormControlName.START_DATE)?.value as Date,
      taskAssignments: assignments.map((assignment) => {
        return { 
        assignee: assignment.assignee,
        creationDate: new Date(),
        dueDate: new Date(),
        task: ({ id: assignment.taskId})
        }
      })
    }

    return taskPeriod;
  }

  save(){
    const taskPeriod = this.generateTaskPeriodFromForm();
    this.taskPeriodService.createTaskPeriod(taskPeriod).subscribe(() => {});
  }
}

