import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { TaskAssignmentService } from '../../service/task-assignment.service';
import { TaskService } from '../../service/task-service.service';
import { TaskAssignmentDto } from '../../model/task-period';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-task-history',
  imports: [SharedModule],
  templateUrl: './task-history.component.html',
  styleUrl: './task-history.component.css'
})
export class TaskHistoryComponent implements OnInit, OnDestroy {
  taskAssignments: TaskAssignmentDto[] = [];

  constructor(private route: ActivatedRoute, private taskService: TaskService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const taskId = params['id'];
      this.taskService.retrieveTaskHistory(taskId).subscribe(taskAssignments => {
        this.taskAssignments = taskAssignments;
      });
      
    });
   }

  ngOnDestroy(): void {
  }

}
