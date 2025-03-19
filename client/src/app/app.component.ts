import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskService } from './service/task-service.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'client';

  constructor(private taskService: TaskService){}

  ngOnInit(): void {
    this.taskService.retrieveTask().subscribe();
  }

  
}
