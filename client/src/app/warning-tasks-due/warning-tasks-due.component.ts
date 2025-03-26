import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { TaskService } from '../service/task-service.service';
import { Task, TaskWithCompletedDate } from '../model/task';
import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-warning-tasks-due',
  imports: [SharedModule],
  templateUrl: './warning-tasks-due.component.html',
  styleUrl: './warning-tasks-due.component.css'
})
export class WarningTasksDueComponent implements OnInit {
  @Input() expiredTasks: TaskWithCompletedDate[] = [];

  constructor(private taskService: TaskService){
  }

  ngOnInit(): void {
  }
}
