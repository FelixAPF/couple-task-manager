import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../../shared.module';
import { TaskList } from '../../../model/task-list';
import { Task } from '../../../model/task';

@Component({
  selector: 'app-assignee-task-list',
  imports: [SharedModule],
  templateUrl: './assignee-task-list.component.html',
  styleUrl: './assignee-task-list.component.scss'
})
export class AssigneeTaskListComponent {
  @Input() taskList: TaskList | undefined;
  @Input() title: string = "";
  @Output() unassignEmitter = new EventEmitter<any>();

  unassign(element: any){
    this.unassignEmitter.emit({element, taskList: this.taskList});
  }
}
