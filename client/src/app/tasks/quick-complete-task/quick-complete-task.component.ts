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
import { SourceMap } from '../my-tasks/my-tasks.component';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';

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
  householdMembers: HouseholdMember[] = [];

  constructor(private taskService: TaskService, private ref: DynamicDialogRef, private householdService: HouseholdService){
  }

  get assignees(){
    return Object.keys(this.ASSIGNEE);
  }
  get assignee() { return this.formGroup.get(FormControlName.ASSIGNEE); }
  get taskId() { return this.formGroup.get(FormControlName.TASK_ID); }

  assigneeOptions: any[] = [];
  
  ngOnInit(): void {
    this.buildFormGroup();
    this.retrieveTasks();

    this.householdService.retrieveHousehold().subscribe((household) => {
      this.householdMembers = household?.members || [];
      this.generateHouseholdOptions();
    });
  }

  generateHouseholdOptions(){

    this.assigneeOptions = Object.values(this.householdMembers)
      .map((member: HouseholdMember) => ({
        label: member.name,
        value: member.id, 
        src: member.imageUrl || 'assets/placeholder.jpg' // Use the image URL from the member or fallback to SourceMap
    }));
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
  }

  quickComplete() {
    if (this.formGroup.valid) {
      // Get the full task object from the form control
      const selectedTaskObject = this.formGroup.value[FormControlName.TASK_ID];
      const assignee = this.formGroup.value[FormControlName.ASSIGNEE];
  
      if (selectedTaskObject && selectedTaskObject.id) { // Add a check
        const taskId = selectedTaskObject.id; // Extract the ID
  
        this.taskService.quickComplete(taskId, assignee).subscribe({
          next: () => {
            this.ref.close(taskId); // Close dialog and indicate success
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
