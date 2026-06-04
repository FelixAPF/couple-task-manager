import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../service/task-service.service';
import { TaskHistoryDto } from '../../model/task-history';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './task-history.component.html'
})
export class TaskHistoryComponent implements OnInit {
  @Input() taskId!: number;
  historyLogs: TaskHistoryDto[] = [];
  loading: boolean = true;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    if (this.taskId) {
      this.taskService.getTaskHistory(this.taskId).subscribe(logs => {
        this.historyLogs = logs;
        this.loading = false;
      });
    }
  }
}