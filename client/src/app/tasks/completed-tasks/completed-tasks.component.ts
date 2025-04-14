import { Component, Input, OnInit } from '@angular/core';
import { TaskService } from '../../service/task-service.service';
import { TaskAssignment } from '../../model/task-period';
import { SharedModule } from '../../shared.module';
import { SourceMap } from '../my-tasks/my-tasks.component';

@Component({
  selector: 'app-completed-tasks',
  imports: [SharedModule],
  templateUrl: './completed-tasks.component.html',
  styleUrl: './completed-tasks.component.css'
})
export class CompletedTasksComponent implements OnInit {
  @Input() completedDate: Date = new Date();
  @Input() taskAssignments: TaskAssignment[] = [];
  readonly SOURCE_MAP = SourceMap;

  constructor(private taskService: TaskService){
  }

  ngOnInit(){
  }

}
