import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { Task } from '../../model/task';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

enum FormControlName {
  ID = 'id',
  TITLE = 'title',
  DESCRIPTION = 'description'
}

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.scss'
})
export class AddTaskComponent implements OnInit {
  fb = inject(FormBuilder);
  formGroup: FormGroup = this.fb.group({});
  subscription: Subscription = new Subscription();
  loadedTask: Task | null = null;

  get titleFormControl(){ return this.formGroup.get(FormControlName.TITLE) }
  get idFormControl(){ return this.formGroup.get(FormControlName.ID) }
  get descriptionFormControl(){ return this.formGroup.get(FormControlName.DESCRIPTION) }


  constructor(private taskService: TaskService, private router: Router, private _location: Location, private route: ActivatedRoute){
    this.buildFormGroup();
  }

  buildFormGroup(task: Task | null = null){
    this.formGroup = this.fb.group({
      [FormControlName.ID]: [this.loadedTask?.id || null],
      [FormControlName.TITLE]: [this.loadedTask?.title || "", [Validators.required]],
      [FormControlName.DESCRIPTION]: [this.loadedTask?.description || "", [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.subscription.add(
      this.route.queryParams.subscribe(params => {
        this.loadedTask = {
          title: params['title'],
          description: params['description'],
          id: params['id'],
        }

        this.buildFormGroup(this.loadedTask);
      })
    )
  }

  save(){
    const task: Task = {
      title: this.titleFormControl?.value,
      description: this.descriptionFormControl?.value,
      id: this.idFormControl?.value,
    }
    
    this.taskService.saveTask(task).subscribe();
    this._location.back();
  }

}
