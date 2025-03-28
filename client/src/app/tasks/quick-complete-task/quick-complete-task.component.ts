import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Assignee } from '../../model/task-period';
import { TaskService } from '../../service/task-service.service';
import { Task } from '../../model/task';
import { Subscription } from 'rxjs';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

enum FormControlName {
  ASSIGNEE = "assignee",
  TASK_ID = "taskId"
}
@Component({
  selector: 'app-quick-complete-task',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './quick-complete-task.component.html',
  styleUrl: './quick-complete-task.component.css'
})
export class QuickCompleteTaskComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  subscription: Subscription = new Subscription();
  formGroup: FormGroup;
  ASSIGNEE = Assignee;
  tasks: Task[] = [];

  constructor(private taskService: TaskService, private ref: DynamicDialogRef){
  }

  get assignees(){
    return Object.keys(this.ASSIGNEE);
  }
  get assignee() { return this.formGroup.get(FormControlName.ASSIGNEE); }
  get taskId() { return this.formGroup.get(FormControlName.TASK_ID); }
  
  ngOnInit(): void {
    this.buildFormGroup();
    this.retrieveTasks();
  }

  buildFormGroup(){
    this.formGroup = this.fb.group({
      [FormControlName.ASSIGNEE]: [,[Validators.required]],
      [FormControlName.TASK_ID]: [, [Validators.required]]
    })
  }

  retrieveTasks(){
    this.subscription.add(this.taskService.retrieveTasks().subscribe((tasks) => {
      this.tasks=tasks;
    }));
  }

  quickComplete(){
    console.log(this.formGroup)
    if(this.formGroup.invalid) return;
    
    this.subscription.add(this.taskService.quickComplete(this.taskId?.value, this.assignee?.value).subscribe(() => {
      this.ref.close(true);
    }))
  }

  onCancel(){
    this.ref.close(false);
  }
}
