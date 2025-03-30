import { AfterViewInit, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Task } from '../../model/task';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TaskWithAssignee } from '../../create-period-dialog/create-period-dialog.component';
import { Assignee } from '../../model/task-period';

enum FormControlName {
  TASK_ID = "taskId",
  TASK_TITLE = "title",
  TASK_DESCRIPTION = "description",
  ASSIGNEE = "assignee",
  SELECTED = "selected",
  TASK_ASSIGNMENTS = "taskAssignments",
  CREATE_EACH_TASK_ONCE = "createEachTaskOnce"
}

@Component({
  selector: 'app-task-assignment',
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './task-assignment.component.html',
  styleUrl: './task-assignment.component.css'
})
export class TaskAssignmentComponent implements OnInit, AfterViewInit, OnChanges {
  ASSIGNEE = Assignee;
  get createEachTaskOnce(){ return this.secondFormGroup.get(FormControlName.CREATE_EACH_TASK_ONCE) }
  get taskAssignments() { return this.secondFormGroup.get(FormControlName.TASK_ASSIGNMENTS) as FormArray };
  fb: FormBuilder = inject(FormBuilder);
  @Input() showCreateEachTaskOnce: boolean = false;
  @Input() tasks: TaskWithAssignee[] = [];
  @Output() submit: EventEmitter<{ taskWithAssignees: TaskWithAssignee[], createEachOnce: boolean }> = new EventEmitter();
  @Output() cancel: EventEmitter<boolean> = new EventEmitter();
  
  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    console.log(this.tasks);
  }

  ngOnChanges(changes: any) {
    if (changes.tasks) {
      // deal with asynchronous Observable result
      this.taskAssignments.clear();

      changes.tasks.currentValue.forEach((taskLink: TaskWithAssignee) => {
        this.taskAssignments.push(this.patchValues(taskLink));
      });
    }
  }

  loadData(){
    this.tasks.forEach((taskLink: TaskWithAssignee) => {
      this.taskAssignments.push(this.patchValues(taskLink));
    });
  }


  secondFormGroup = this.fb.group({
    [FormControlName.TASK_ASSIGNMENTS]: this.fb.array([]),
    [FormControlName.CREATE_EACH_TASK_ONCE]: [false, []]
  });
  
  patchValues(taskLink: TaskWithAssignee) {
    return this.fb.group({
      [FormControlName.TASK_TITLE]: [taskLink?.task.title || ""],
      [FormControlName.TASK_DESCRIPTION]: [taskLink?.task.description || ""],
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
