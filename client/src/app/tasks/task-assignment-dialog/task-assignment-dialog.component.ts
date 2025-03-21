import { ChangeDetectionStrategy, Component, ElementRef, inject, Renderer2, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, take } from 'rxjs';
import { Frequency, Task } from '../../model/task';
import { TaskService } from '../../service/task-service.service';
import { TaskPeriodService } from '../../service/task-period.service';
import { Assignee, TaskAssignment, TaskPeriod } from '../../model/task-period';
import { TaskListService } from '../../service/task-list.service';
import { TaskLink } from '../../model/local-model';
import { TaskList } from '../../model/task-list';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

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
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './task-assignment-dialog.component.html',
  styleUrl: './task-assignment-dialog.component.scss',
  providers: [ provideNativeDateAdapter() ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskAssignmentDialogComponent {
  ASSIGNEE = Assignee;
  fb = inject(FormBuilder);
  subscription: Subscription = new Subscription();
  taskList: any | null = null;
  activeStep: number = 1;
  tasks: Task[] = [];
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
    const control = this.taskLinks.at(index).get(controlName);
    return control as FormControl;
  }

  constructor(public dialogService: DialogService,private taskService: TaskService, private taskListService: TaskListService,
    private renderer: Renderer2,
    public ref: DynamicDialogRef) {    
  }

  next(){
    this.activeStep++;
  }

  submit(){
    this.taskListService.saveTasksToExistingTaskList(this.assignee?.value, this.generateTaskList()).subscribe(() => {
      this.ref.close();
    })
  }
  loadTasks() {
    return this.taskService.retrieveTasks().pipe(take(1)).subscribe(tasks => { // Return the subscription and add take(1)
      const taskLink: TaskLink[] = tasks.map((task) => ({
        selected: this.taskList?.tasks.find((t: Task) => task.id === t?.id) !== undefined,
        task
      }));

      const formArray = this.secondFormGroup.get(FormControlName.TASK_LINKS) as FormArray;
      formArray.clear();
      taskLink.forEach(t => formArray.push(this.patchValues(t)));

      this.tableData = taskLink.map(link => ({
        title: link.task.title,
        description: link.task.description,
        taskId: link.task.id,
        selected: link.selected
      }));

      this.tasks = tasks;
    });
  }

  log(element: any){
    console.log(element);
  }
  createTaskList(callback: any) {
    const assignee = this.assignee?.value;
    if (!assignee) return;
  
    this.taskListService.retrieveTaskList(assignee).subscribe((taskList) => {
      this.taskList = taskList;
      console.log("TASK LIST RETRIEVED",this.taskList);
      const loadTasksAndCallback = () => {
        this.loadTasks().add(() => { // Wait for loadTasks() to complete
          callback(2);
        });
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
  

  patchValues(taskLink: TaskLink) {
    return this.fb.group({
      [AssignmentRow.TASK_TITLE]: [taskLink?.task.title || ""],
      [AssignmentRow.TASK_DESCRIPTION]: [taskLink?.task.description || ""],
      [AssignmentRow.TASK_ID]: [taskLink?.task.id],
      [AssignmentRow.SELECTED]: [taskLink?.selected || false]
    })    
  }

  generateTaskList(): number[] {
    const taskLinksFormValue = this.taskLinks?.value as any[];
    return taskLinksFormValue.filter((taskLink) => taskLink.selected).map((taskLink) => taskLink.taskId);
  }

  // save(){
  //   const taskPeriod = this.generateTaskPeriodFromForm();
  //   this.taskPeriodService.createTaskPeriod(taskPeriod).subscribe(() => {});
  // }
}

