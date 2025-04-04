import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../../shared.module';
import { TaskList } from '../../../model/task-list';
import { Task } from '../../../model/task';
import { RoomPipe } from '../../../shared/pipes/room-pipe';
import { FrequencyPipe } from '../../../shared/pipes/frequency-pipe';

@Component({
  selector: 'app-assignee-task-list',
  imports: [SharedModule, RoomPipe, FrequencyPipe],
  templateUrl: './assignee-task-list.component.html',
  styleUrl: './assignee-task-list.component.css'
})
export class AssigneeTaskListComponent {
  @Input() taskList: TaskList | undefined;
  @Input() title: string = "";
  @Output() unassignEmitter = new EventEmitter<any>();

  unassign(element: any){
    this.unassignEmitter.emit({element, taskList: this.taskList});
  }
}
