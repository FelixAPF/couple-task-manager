import { Component } from '@angular/core';
import { TaskService } from '../service/task-service.service';
import { Task } from '../model/task';
import { Subscription } from 'rxjs';
import { SharedModule } from '../shared.module';
import { MatTableDataSource } from '@angular/material/table';
import { MenuItem, MessageService } from 'primeng/api';
import { FrequencyPipe } from '../shared/pipes/frequency-pipe';

@Component({
  selector: 'app-tasks',
  imports: [SharedModule, FrequencyPipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
  providers: [MessageService]
})
export class TasksComponent {
  tasks: Task[] = [];
  items: MenuItem[];
  subscription: Subscription = new Subscription();
  displayedColumns = [ "title", "description", "delete"]
  dataSource = new MatTableDataSource<Task>();
  
    constructor(private taskService: TaskService, private messageService: MessageService){
      this.items = [
        {
            label: 'Update',  routerLink: ['/add-task'], queryParams: {}
        },
        { separator: true },
        { label: 'Upload',  }
    ];
    }

    update(){

    }

  
    ngOnInit(): void {
      this.retrieveTasks();
    }

    retrieveTasks(){
      this.subscription.add(this.taskService.retrieveTasks()
        .subscribe(tasks => {
          this.tasks = tasks;
      }));
    }
  
    delete(id: number){
      this.subscription.add(this.taskService.deleteTask(id).subscribe(() => this.retrieveTasks()));
    }
}
