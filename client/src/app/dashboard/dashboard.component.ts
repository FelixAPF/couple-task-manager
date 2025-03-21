import { Component } from '@angular/core';
import { TaskService } from '../service/task-service.service';
import { SharedModule } from '../shared.module';
import { MyTasksComponent } from '../tasks/my-tasks/my-tasks.component';

@Component({
  selector: 'app-dashboard',
  imports: [SharedModule, MyTasksComponent],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  constructor(private taskService: TaskService){}

  ngOnInit(): void {
    this.taskService.retrieveCurrentPeriodDate().subscribe();
  }

}
