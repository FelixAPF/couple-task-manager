import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, take } from 'rxjs';
import { Frequency, Task } from '../../model/task';
import { TaskService } from '../../service/task-service.service';
import { TaskPeriodService } from '../../service/task-period.service';
import { Assignee, BasicTaskAssignmentRqst, TaskAssignment, TaskPeriod } from '../../model/task-period';
import { TaskListService } from '../../service/task-list.service';
import { TaskLink } from '../../model/local-model';
import { TaskList } from '../../model/task-list';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TaskAssignmentComponent, TasksInputParameter } from '../task-assignment/task-assignment.component';
import { TaskWithAssignee } from '../../create-period-dialog/create-period-dialog.component';
import { TaskAssignmentService } from '../../service/task-assignment.service';
import { Platform } from '@angular/cdk/platform';
import { PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { HouseholdService } from '../../service/household.service';
import { HouseholdMember } from '../../model/household';

enum FormControlName {
  ASSIGNEE = "assignee",
  TASK_LINKS = 'taskLinks'
}

enum AssignmentRow {
  TASK_ID = "taskId",
  TASK_TITLE = "title",
  TASK_DESCRIPTION = "description",
  ASSIGNEE = "assignee",
  SELECTED = "selected"
}

@Component({
  selector: 'app-task-assignment-dialog',
  imports: [SharedModule, ReactiveFormsModule, TaskAssignmentComponent],
  templateUrl: './task-assignment-dialog.component.html',
  styleUrl: './task-assignment-dialog.component.css',
  providers: [ provideNativeDateAdapter() ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAssignmentDialogComponent implements OnInit {
  householdService: HouseholdService = inject(HouseholdService);
  fb = inject(FormBuilder);
  subscription: Subscription = new Subscription();
  taskList: any | null = null;
  tasks: Task[] = [];
  assignees: HouseholdMember[] = [];
  displayedColumns = ["title", "assignment"]
  @ViewChild('tableContainer') tableContainer!: ElementRef;


  firstFormGroup = this.fb.group({
    [FormControlName.ASSIGNEE]: [null, [Validators.required]],
  });
  secondFormGroup = this.fb.group({
    [FormControlName.TASK_LINKS]: this.fb.array([]),  
  });
AssignmentRow = AssignmentRow;
  tableData: any[] = [];

  get taskLinks(): FormArray {
    return this.secondFormGroup.get(FormControlName.TASK_LINKS) as FormArray;
  }
  get assignee(): AbstractControl | null {
    return this.firstFormGroup.get(FormControlName.ASSIGNEE);
  }

  getFormControl(index: number, controlName: string): FormControl {
    const control = this.taskLinks.at(index)?.get(controlName);
    return control as FormControl;
  }

  constructor(public dialogService: DialogService,private taskService: TaskService, private taskListService: TaskListService,
    private renderer: Renderer2, public taskAssignmentService: TaskAssignmentService,
    public ref: DynamicDialogRef) {    
  }
  backButtonListener: PluginListenerHandle; 

  ngOnInit(){
    this.loadTaskAssignments();
  }

  submit(tasksWithAssignment: { taskWithAssignees: TaskWithAssignee[], createEachOnce: boolean }){
    const basicTaskAssignmentRqsts: any[] = tasksWithAssignment?.taskWithAssignees?.map(taskWithAssignee => ({ assigneeUserId: taskWithAssignee.assigneeUserId, taskId: taskWithAssignee.task.id }));

        
    this.taskListService.saveTasksToExistingTaskList(basicTaskAssignmentRqsts).subscribe(() => {
      this.ref.close();
    })
  }

  loadTaskAssignments() {
    return this.taskListService.retrieveWithUnassigned().subscribe((taskLists) => {
      // 1. Explicitly type the array
      const newDataList: TaskWithAssignee[] = [];

      for (let list of taskLists) {
        // Use stricter check for tasks array
        if (!list.tasks || list.tasks.length === 0) continue;

        // Extract the assignee's ID. Use optional chaining and nullish coalescing
        // Assumes list.assignee is of type HouseholdMember | null | undefined
        // If list.assignee represents "Unassigned" without an ID, this will correctly result in null.
        const assigneeId: number | null = list.assignee?.id ?? null;

        for (let task of list.tasks) {
          // 2. Push an object matching the TaskWithAssignee interface
          newDataList.push({
            task: task,
            assigneeUserId: assigneeId // Use the extracted ID
          });
        }
      }
      // Now newDataList has the correct type TaskWithAssignee[]
      this.taskAssignmentService.setTaskAssignments(newDataList);
    });
  }
  
  createTaskList(callback: any) {
    const assignee = this.assignee?.value;
    if (!assignee) return;
  
    this.taskListService.retrieveTaskList(assignee).subscribe((taskList) => {
      this.taskList = taskList;
      const loadTasksAndCallback = () => {
        this.loadTaskAssignments().add(() => {
          callback(2);
        })
      };
  
      if (!taskList) {
        this.taskListService.saveTaskList({ id: null, assignee, tasks: [] }).subscribe(() => {
          loadTasksAndCallback();
        });
      } else {
        loadTasksAndCallback();
      }
    });
  }

  cancel(){
    this.ref.close();
  }
  

}

