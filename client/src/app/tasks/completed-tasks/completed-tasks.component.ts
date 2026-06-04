import { Component, Input, OnInit } from '@angular/core';
import { TaskAssignmentDto } from '../../model/task-period';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-completed-tasks',
  imports: [SharedModule],
  templateUrl: './completed-tasks.component.html',
  styleUrl: './completed-tasks.component.css'
})
export class CompletedTasksComponent implements OnInit {
  @Input() completedDate: Date = new Date();
  @Input() taskAssignments: TaskAssignmentDto[] = [];

  constructor(){
  }

  ngOnInit(){
  }

}