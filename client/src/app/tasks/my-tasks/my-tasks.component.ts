import { Component, OnInit } from '@angular/core';
import { Assignee, TaskAssignment } from '../../model/task-period';
import { SharedModule } from '../../shared.module';
import { TaskService } from '../../service/task-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { Task } from '../../model/task';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-tasks',
  imports: [SharedModule],
  templateUrl: './my-tasks.component.html',
  styleUrl: './my-tasks.component.scss'
})
export class MyTasksComponent implements OnInit {
  tasks: Task[] = [];
  subscription: Subscription = new Subscription();
  displayedColumns = [ "title", "description", "dueDate", "complete"]
  dataSource = new MatTableDataSource<TaskAssignment>();
  
  selectedAssignee: Assignee = Assignee.Camille;
  taskAssignments: TaskAssignment[] = [];
  constructor(private taskService: TaskService){}

  ngOnInit(): void {
    this.retrieveTaskByAssignee();
  }

  changeUser(){
    this.selectedAssignee = this.selectedAssignee === Assignee.Camille ? Assignee.Felix : Assignee.Camille;
    this.retrieveTaskByAssignee();
  }

  retrieveTaskByAssignee(){
    this.subscription.add(this.taskService.retrieveTaskByAssignee(this.selectedAssignee).subscribe(taskAssignments => {
      this.tasks = taskAssignments.map(({ assignee, creationDate, dueDate, task, id, period }) => ({
        assignee, creationDate, dueDate, task, id, period
      }));
      this.taskAssignments = taskAssignments;
    }))
  }

  completeTask(elementId: number){
    this.subscription.add(this.taskService.completeTask(elementId).subscribe(() => {
      this.retrieveTaskByAssignee();
    }));
  }
}
