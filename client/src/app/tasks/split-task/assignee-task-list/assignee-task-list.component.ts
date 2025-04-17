import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../../../shared.module';
import { TaskList } from '../../../model/task-list';
import { Task } from '../../../model/task';
import { RoomPipe } from '../../../shared/pipes/room-pipe';
import { Assignee } from '../../../model/task-period';
import { SourceMap } from '../../my-tasks/my-tasks.component';

@Component({
  selector: 'app-assignee-task-list',
  imports: [SharedModule, RoomPipe],
  templateUrl: './assignee-task-list.component.html',
  styleUrl: './assignee-task-list.component.css'
})
export class AssigneeTaskListComponent {
  readonly ASSIGNEE = Assignee;
  readonly SOURCE_MAP = SourceMap;
  @Input() taskList: TaskList | undefined;
  @Input() title: string = "";
  @Input() assignee: Assignee = Assignee.Unassigned;
  @Input() index: number;
  @Output() unassignEmitter = new EventEmitter<any>();
  @Output() editTaskEmitter = new EventEmitter<any>();
  @Output() deleteTaskEmitter = new EventEmitter<any>();

  unassign(element: any){
    this.unassignEmitter.emit({element, taskList: this.taskList});
  }

  editTask(element: any){
    this.editTaskEmitter.emit(element);
  }

  deleteTask(event: any, element: any){
    this.deleteTaskEmitter.emit({event, element});
  }
}
