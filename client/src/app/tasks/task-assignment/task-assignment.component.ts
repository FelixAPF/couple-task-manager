import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Task } from '../../model/task';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TaskWithAssignee } from '../../create-period-dialog/create-period-dialog.component';
import { Assignee } from '../../model/task-period';
import { Observable, Subscription, timer } from 'rxjs';
import { TaskAssignmentService } from '../../service/task-assignment.service';
import { CheckboxChangeEvent } from 'primeng/checkbox';

enum FormControlName {
  TASK_ID = "taskId",
  TASK_TITLE = "title",
  TASK_DESCRIPTION = "description",
  FREQUENCY = "frequency",
  ROOM = "room",
  ASSIGNEE = "assignee",
  SELECTED = "selected",
  TASK_ASSIGNMENTS = "taskAssignments",
  CREATE_EACH_TASK_ONCE = "createEachTaskOnce"
}

export interface TasksInputParameter {
  tasks: TaskWithAssignee[];
}

@Component({
  selector: 'app-task-assignment',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './task-assignment.component.html',
  styleUrl: './task-assignment.component.css'
})
export class TaskAssignmentComponent implements OnInit, OnDestroy {
  ASSIGNEE = Assignee;
  subscription: Subscription = new Subscription();
  showDescription = false;
  get createEachTaskOnce(){ return this.secondFormGroup.get(FormControlName.CREATE_EACH_TASK_ONCE) }
  get taskAssignments() { return this.secondFormGroup.get(FormControlName.TASK_ASSIGNMENTS) as FormArray };
  fb: FormBuilder = inject(FormBuilder);
  @Input() showCreateEachTaskOnce: boolean = false;
  taskObs: Observable<TaskWithAssignee[] | null>;

  @Output() submit: EventEmitter<{ taskWithAssignees: TaskWithAssignee[], createEachOnce: boolean }> = new EventEmitter();
  @Output() cancel: EventEmitter<boolean> = new EventEmitter();
  
  constructor(private taskAssignmentService: TaskAssignmentService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
  }
  onChange($event: CheckboxChangeEvent) {
    this.showDescription = !this.showDescription;
  }
  ngOnDestroy(){
    this.subscription.unsubscribe();
  }
  
  loadData(){
    this.subscription.add(
      this.taskAssignmentService.getTaskAssignments().subscribe((data) => {
        this.taskAssignments.clear();
        if (data && data.length) {
          data.forEach((t) => {
            this.taskAssignments.push(this.patchValues(t));
          });
        }
        this.cdr.detectChanges();
      })
    );
  }

  secondFormGroup = this.fb.group({
    [FormControlName.TASK_ASSIGNMENTS]: this.fb.array([]),
    [FormControlName.CREATE_EACH_TASK_ONCE]: [false, []]
  });
  
  patchValues(taskLink: TaskWithAssignee) {
    return this.fb.group({
      [FormControlName.TASK_TITLE]: [taskLink?.task.title || ""],
      [FormControlName.TASK_DESCRIPTION]: [taskLink?.task.description || ""],
      [FormControlName.ROOM]: [taskLink?.task.room || ""],
      [FormControlName.FREQUENCY]: [taskLink?.task.frequency || ""],
      [FormControlName.TASK_ID]: [taskLink?.task.id],
      [FormControlName.ASSIGNEE]: [taskLink?.assignee || null]
    })    
  }

  getFormControl(index: number, controlName: string): FormControl {
    const control = this.taskAssignments.at(index)?.get(controlName);
    return control as FormControl;
  }

  onSubmit(){
    const tasksWithAssignment: TaskWithAssignee[] = this.taskAssignments.getRawValue()?.map(taskAssignment =>({
      task: {
        id: taskAssignment.taskId,
        title: taskAssignment.title,
        description: taskAssignment.description,
        period: null
      },
      assignee: taskAssignment.assignee
    })).filter(task => task.assignee !== null);

    this.submit.emit({ taskWithAssignees: tasksWithAssignment, createEachOnce: this.createEachTaskOnce?.value || false });
  }

  onCancel(){
    this.cancel.emit(true);
  }

  

}
