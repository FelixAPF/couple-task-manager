// c:\Users\Felix\Documents\Projects\couple-task-manager\client\src\app\tasks\assignee-task-list\assignee-task-list.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared.module'; // For PrimeNG modules
import { Task } from '../../../model/task';
import { HouseholdMember } from '../../../model/household'; // Import HouseholdMember

@Component({
  selector: 'app-assignee-task-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './assignee-task-list.component.html',
  styleUrls: ['./assignee-task-list.component.css']
})
export class AssigneeTaskListComponent {
  @Input() member: HouseholdMember | null = null;
  @Input() tasks: Task[] = [];

  @Input() taskList: { tasks?: Task[] } | undefined;
  @Input() title: string = '';
  @Input() assignee: HouseholdMember | null = null;
  @Input() index: number = 0;

  @Output() unassignEmitter = new EventEmitter<Task>();
  @Output() editTaskEmitter = new EventEmitter<Task>();
  @Output() deleteTaskEmitter = new EventEmitter<Task>();

  unassign(task: Task) {
    this.unassignEmitter.emit(task);
  }

  editTask(task: Task) {
    this.editTaskEmitter.emit(task);
  }

  deleteTask(event: any, task: Task) {
    this.deleteTaskEmitter.emit(task);
  }

  trackByTaskId(index: number, task: Task): number | string {
    return task.id ?? index;
  }
}