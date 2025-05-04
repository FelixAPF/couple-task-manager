import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { TaskAssignmentService } from '../../service/task-assignment.service';
import { TaskService } from '../../service/task-service.service';
import { TaskAssignmentDto } from '../../model/task-period';
import { SharedModule } from '../../shared.module';
import { Task } from '../../model/task';
import { HouseholdService } from '../../service/household.service';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-task-history',
  imports: [SharedModule, TitleCasePipe],
  templateUrl: './task-history.component.html',
  styleUrl: './task-history.component.css'
})
export class TaskHistoryComponent implements OnInit, OnDestroy {
  taskAssignments: TaskAssignmentDto[] = [];
  task: Task = {} as Task;

  constructor(private route: ActivatedRoute, private taskService: TaskService, private householdService: HouseholdService) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const taskId = params['id'];
      this.taskService.retrieveTaskHistory(taskId).subscribe(({ task, taskAssignments}) => {
        this.task = task;
        this.taskAssignments = taskAssignments.sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());
      });
      
    });
   }

  ngOnDestroy(): void {
  }

}
