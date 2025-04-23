import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { Frequency, Task } from '../../model/task';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaskWithAssignee } from '../../create-period-dialog/create-period-dialog.component';
import { Assignee } from '../../model/task-period';
import { Observable, Subscription, take, timer } from 'rxjs';
import { TaskAssignmentService } from '../../service/task-assignment.service';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { RoomPipe } from '../../shared/pipes/room-pipe';
import { HouseholdMember } from '../../model/household';
import { HouseholdService } from '../../service/household.service';

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
  imports: [SharedModule, ReactiveFormsModule, RoomPipe, FormsModule],
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
  householdService: HouseholdService = inject(HouseholdService);
  householdMembers: HouseholdMember[] = [];
  householdMembersOptions: { label: string, value: number | null }[] = [];
  @Input() showCreateEachTaskOnce: boolean = false;
  taskObs: Observable<TaskWithAssignee[] | null>;

  @Output() submit: EventEmitter<{ taskWithAssignees: TaskWithAssignee[], createEachOnce: boolean }> = new EventEmitter();
  @Output() cancel: EventEmitter<boolean> = new EventEmitter();

  constructor(private taskAssignmentService: TaskAssignmentService, private cdr: ChangeDetectorRef ) {}

  ngOnInit(): void {
    this.loadData();

    this.householdService.retrieveHousehold().subscribe((household) => {
      this.householdMembers = household?.members || [];
      this.generateHouseholdOptions();
    });
  }

  generateHouseholdOptions(){
    this.householdMembersOptions = [...this.householdMembers.map((member) => {
      return { label: member.name, value: member.id }
    }), { label: "Non assigné", value: null }];
  }
  onChange($event: CheckboxChangeEvent) {
    this.showDescription = !this.showDescription;
  }
  ngOnDestroy(){
    this.subscription.unsubscribe();
  }

  sortByAssignee(): void {
    this.taskAssignments.controls.sort((a, b) => {
      const assigneeA = a.get(FormControlName.ASSIGNEE)?.value;
      const assigneeB = b.get(FormControlName.ASSIGNEE)?.value;
      return (assigneeA > assigneeB) ? 1 : -1;
    });
    this.cdr.detectChanges();
  }

  frequencyPriority: any = {
    [Frequency.DAILY]: 0,
    [Frequency.WEEKLY]: 1,
    [Frequency.BIWEEKLY]: 2,
    [Frequency.MONTHLY]: 3,
    [Frequency.QUARTERLY]: 4,
    [Frequency.BIYEARLY]: 5,
    [Frequency.YEARLY]: 6
  }
  
  sortByFrequency(): void {
    this.taskAssignments.controls.sort((a, b) => {
      const frequencyA = a.get(FormControlName.FREQUENCY)?.value;
      const frequencyB = b.get(FormControlName.FREQUENCY)?.value;
      const priorityA: any = this.frequencyPriority[frequencyA] || 0;
      const priorityB: any = this.frequencyPriority[frequencyB] || 0;
      if (priorityA === priorityB) {
        return 0; // If frequencies are the same, keep original order
      }

      return (priorityA > priorityB) ? 1 : -1;
    });
    this.cdr.detectChanges();
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
      [FormControlName.ASSIGNEE]: [taskLink?.assigneeUserId || null]
    });
  }

  getFormControl(id: number, controlName: string): FormControl {
    return this.taskAssignments.controls.find((control) => {
      const taskId = control.get(FormControlName.TASK_ID)?.value;
      return taskId === id;
    })?.get(controlName) as FormControl;
  }

  onSubmit(){
    const tasksWithAssignment: TaskWithAssignee[] = this.taskAssignments.getRawValue()?.map(taskAssignment =>({
      task: {
        id: taskAssignment.taskId,
        title: taskAssignment.title,
        description: taskAssignment.description,
        period: null
      },
      assigneeUserId: taskAssignment.assignee
    })).filter(task => task.assigneeUserId !== null);

    this.submit.emit({ taskWithAssignees: tasksWithAssignment, createEachOnce: this.createEachTaskOnce?.value || false });
  }

  onCancel(){
    this.cancel.emit(true);
  }



}
