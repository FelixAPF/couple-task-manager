import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Assignee } from '../../model/task-period';
import { TaskService } from '../../service/task-service.service';
import { Task } from '../../model/task';
import { Subscription } from 'rxjs';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Platform } from '@angular/cdk/platform';
import { PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

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
  filteredTasks: Task[] = [];
  tasks: Task[] = [];

  constructor(private taskService: TaskService, private ref: DynamicDialogRef){
  }

  get assignees(){
    return Object.keys(this.ASSIGNEE);
  }
  get assignee() { return this.formGroup.get(FormControlName.ASSIGNEE); }
  get taskId() { return this.formGroup.get(FormControlName.TASK_ID); }

  srcMap = {
    [Assignee.Camille]: "assets/person2.jpg",
    [Assignee.Felix]: "assets/person1.jpg",
    [Assignee.Deux]: "assets/placeholder.jpg",
  }

  assigneeOptions: any[] = [];
  
  ngOnInit(): void {
    this.buildFormGroup();
    this.retrieveTasks();

    this.assigneeOptions = Object.values(this.ASSIGNEE)
      .map((assigneeValue: Assignee) => ({
        label: assigneeValue, 
        src: this.srcMap[assigneeValue] 
    // Filter out "Deux" if it shouldn't be selectable here
    }));

  console.log(this.assigneeOptions);
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

  searchTask(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase(); // Get the user's query, lowercase
    if (!this.tasks) {
      this.filteredTasks = []; // Handle case where tasks haven't loaded yet
      return;
    }

    this.filteredTasks = this.tasks.filter(task =>
      task.title?.toLowerCase().includes(query)
    );
    // console.log('Filtered tasks:', this.filteredTasks); // Optional log
  }

  quickComplete() {
    if (this.formGroup.valid) {
      // Get the full task object from the form control
      const selectedTaskObject = this.formGroup.value[FormControlName.TASK_ID];
      const assignee = this.formGroup.value[FormControlName.ASSIGNEE];
  
      // --- CHANGE HERE: Access the 'id' property from the object ---
      if (selectedTaskObject && selectedTaskObject.id) { // Add a check
        const taskId = selectedTaskObject.id; // Extract the ID
  
        this.taskService.quickComplete(taskId, assignee).subscribe({
          next: () => {
            this.ref.close(true); // Close dialog and indicate success
          },
          error: (err) => {
            console.error("Error during quick complete:", err);
          }
        });
      } else {
        console.error("Selected task object or its ID is missing:", selectedTaskObject);
      }
    }
  }

  onCancel(){
    this.ref.close(false);
  }
}
